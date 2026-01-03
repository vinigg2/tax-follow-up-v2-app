<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\Company;
use App\Infrastructure\Persistence\Models\Obligation;
use App\Infrastructure\Persistence\Models\Document;
use App\Infrastructure\Persistence\Models\DocumentType;
use App\Infrastructure\Persistence\Models\Approver;
use App\Infrastructure\Persistence\Models\ApproverSignature;
use App\Infrastructure\Persistence\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DocumentTest extends TestCase
{
    protected Company $company;
    protected Obligation $obligation;
    protected Task $task;
    protected DocumentType $documentType;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->createUserWithGroup();
        $this->company = Company::factory()->forGroup($this->group)->create();
        $this->obligation = Obligation::factory()->forGroup($this->group)->create();
        $this->documentType = DocumentType::factory()
            ->forObligation($this->obligation)
            ->noApproval()
            ->create();
        $this->task = Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->create();
    }

    // ==================== INDEX TESTS ====================

    public function test_can_list_documents(): void
    {
        Document::factory()
            ->count(3)
            ->forTask($this->task)
            ->create(['document_type_id' => $this->documentType->id]);

        $this->actingAsUser();

        $response = $this->getJson('/api/documents', $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'documents',
                'meta' => ['total', 'per_page', 'current_page', 'last_page'],
            ]);
    }

    public function test_can_filter_documents_by_task(): void
    {
        $task2 = Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->create();

        Document::factory()
            ->forTask($this->task)
            ->create(['name' => 'Doc Task 1', 'document_type_id' => $this->documentType->id]);

        Document::factory()
            ->forTask($task2)
            ->create(['name' => 'Doc Task 2', 'document_type_id' => $this->documentType->id]);

        $this->actingAsUser();

        $response = $this->getJson("/api/documents?task_id={$this->task->id}", $this->withTenantHeaders());

        $response->assertOk();
        $documents = $response->json('documents');
        $this->assertCount(1, $documents);
        $this->assertEquals('Doc Task 1', $documents[0]['name']);
    }

    public function test_can_filter_documents_by_status(): void
    {
        Document::factory()
            ->forTask($this->task)
            ->unstarted()
            ->create(['document_type_id' => $this->documentType->id]);

        Document::factory()
            ->forTask($this->task)
            ->finished()
            ->create(['document_type_id' => $this->documentType->id]);

        $this->actingAsUser();

        $response = $this->getJson('/api/documents?status=unstarted', $this->withTenantHeaders());

        $response->assertOk();
        $documents = $response->json('documents');
        $this->assertCount(1, $documents);
        $this->assertEquals('unstarted', $documents[0]['status']);
    }

    // ==================== SHOW TESTS ====================

    public function test_can_show_single_document(): void
    {
        $document = Document::factory()
            ->forTask($this->task)
            ->create(['document_type_id' => $this->documentType->id]);

        $this->actingAsUser();

        $response = $this->getJson("/api/documents/{$document->id}", $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'document' => [
                    'id', 'name', 'description', 'status',
                    'task', 'company', 'document_type',
                ],
            ]);
    }

    // ==================== UPLOAD TESTS ====================

    public function test_can_upload_document_file(): void
    {
        config(['taxfollowup.upload.allowed_extensions' => ['pdf', 'doc', 'docx', 'xlsx', 'jpg', 'png']]);

        $document = Document::factory()
            ->forTask($this->task)
            ->unstarted()
            ->create([
                'document_type_id' => $this->documentType->id,
                'approval_required' => 'N',
            ]);

        $file = UploadedFile::fake()->create('test.pdf', 1024);

        $this->actingAsUser();

        $response = $this->postJson("/api/documents/{$document->id}/upload", [
            'file' => $file,
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Arquivo enviado com sucesso!']);

        $document->refresh();
        $this->assertNotNull($document->document_path);
        $this->assertEquals('finished', $document->status);

        // Should create timeline entry
        $this->assertDatabaseHas('timelines', [
            'task_id' => $this->task->id,
            'document_id' => $document->id,
            'type' => 'send_file',
        ]);
    }

    public function test_cannot_upload_disallowed_file_extension(): void
    {
        config(['taxfollowup.upload.allowed_extensions' => ['pdf']]);

        $document = Document::factory()
            ->forTask($this->task)
            ->unstarted()
            ->create(['document_type_id' => $this->documentType->id]);

        $file = UploadedFile::fake()->create('test.exe', 1024);

        $this->actingAsUser();

        $response = $this->postJson("/api/documents/{$document->id}/upload", [
            'file' => $file,
        ], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJson(['message' => 'Extensao de arquivo nao permitida.']);
    }

    public function test_upload_sends_for_approval_when_required(): void
    {
        config(['taxfollowup.upload.allowed_extensions' => ['pdf']]);

        $documentType = DocumentType::factory()
            ->forObligation($this->obligation)
            ->sequentialApproval()
            ->create();

        // Create approver for the document type
        Approver::create([
            'document_type_id' => $documentType->id,
            'user_id' => $this->user->id,
            'sequence' => 1,
        ]);

        $document = Document::factory()
            ->forTask($this->task)
            ->unstarted()
            ->create([
                'document_type_id' => $documentType->id,
                'approval_required' => 'S',
            ]);

        $file = UploadedFile::fake()->create('test.pdf', 1024);

        $this->actingAsUser();

        $response = $this->postJson("/api/documents/{$document->id}/upload", [
            'file' => $file,
        ], $this->withTenantHeaders());

        $response->assertOk();

        $document->refresh();
        $this->assertEquals('on_approval', $document->status);

        // Should create approval signatures
        $this->assertDatabaseHas('approver_signatures', [
            'document_id' => $document->id,
            'user_id' => $this->user->id,
            'status' => 'pending',
        ]);
    }

    // ==================== RESET TESTS ====================

    public function test_can_reset_document(): void
    {
        $document = Document::factory()
            ->forTask($this->task)
            ->withFile()
            ->create(['document_type_id' => $this->documentType->id]);

        $this->actingAsUser();

        $response = $this->postJson("/api/documents/{$document->id}/reset", [], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Documento resetado com sucesso!']);

        $document->refresh();
        $this->assertNull($document->document_path);
        $this->assertEquals('unstarted', $document->status);

        // Should create timeline entry
        $this->assertDatabaseHas('timelines', [
            'task_id' => $this->task->id,
            'document_id' => $document->id,
            'type' => 'reset_document',
        ]);
    }

    // ==================== APPROVAL TESTS ====================

    public function test_approver_can_approve_document(): void
    {
        $document = Document::factory()
            ->forTask($this->task)
            ->onApproval()
            ->create([
                'document_type_id' => $this->documentType->id,
                'approval_required' => 'S',
            ]);

        // Create pending signature for user
        ApproverSignature::create([
            'document_id' => $document->id,
            'user_id' => $this->user->id,
            'sequence' => 1,
            'status' => 'pending',
        ]);

        $this->actingAsUser();

        $response = $this->postJson("/api/documents/{$document->id}/approve", [
            'comment' => 'Looks good!',
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Documento aprovado com sucesso!']);

        // Signature should be signed
        $this->assertDatabaseHas('approver_signatures', [
            'document_id' => $document->id,
            'user_id' => $this->user->id,
            'status' => 'signed',
        ]);

        // Should create timeline entry
        $this->assertDatabaseHas('timelines', [
            'task_id' => $this->task->id,
            'document_id' => $document->id,
            'type' => 'approved',
        ]);
    }

    public function test_non_approver_cannot_approve_document(): void
    {
        $document = Document::factory()
            ->forTask($this->task)
            ->onApproval()
            ->create([
                'document_type_id' => $this->documentType->id,
                'approval_required' => 'S',
            ]);

        // No pending signature for this user
        $this->actingAsUser();

        $response = $this->postJson("/api/documents/{$document->id}/approve", [
            'comment' => 'Trying to approve',
        ], $this->withTenantHeaders());

        $response->assertForbidden();
    }

    public function test_approver_can_reject_document(): void
    {
        $document = Document::factory()
            ->forTask($this->task)
            ->onApproval()
            ->create([
                'document_type_id' => $this->documentType->id,
                'approval_required' => 'S',
            ]);

        ApproverSignature::create([
            'document_id' => $document->id,
            'user_id' => $this->user->id,
            'sequence' => 1,
            'status' => 'pending',
        ]);

        $this->actingAsUser();

        $response = $this->postJson("/api/documents/{$document->id}/reject", [
            'comment' => 'This needs revision.',
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Documento rejeitado.']);

        $document->refresh();
        $this->assertEquals('restarted', $document->status);

        // Signature should be rejected
        $this->assertDatabaseHas('approver_signatures', [
            'document_id' => $document->id,
            'user_id' => $this->user->id,
            'status' => 'rejected',
        ]);

        // Should create timeline entry
        $this->assertDatabaseHas('timelines', [
            'task_id' => $this->task->id,
            'document_id' => $document->id,
            'type' => 'rejected',
        ]);
    }

    public function test_rejection_requires_comment(): void
    {
        $document = Document::factory()
            ->forTask($this->task)
            ->onApproval()
            ->create([
                'document_type_id' => $this->documentType->id,
                'approval_required' => 'S',
            ]);

        ApproverSignature::create([
            'document_id' => $document->id,
            'user_id' => $this->user->id,
            'sequence' => 1,
            'status' => 'pending',
        ]);

        $this->actingAsUser();

        $response = $this->postJson("/api/documents/{$document->id}/reject", [], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['comment']);
    }

    public function test_document_finished_when_all_approvers_sign(): void
    {
        $document = Document::factory()
            ->forTask($this->task)
            ->onApproval()
            ->create([
                'document_type_id' => $this->documentType->id,
                'approval_required' => 'P', // Parallel approval
            ]);

        // Only one approver, so approval completes the document
        ApproverSignature::create([
            'document_id' => $document->id,
            'user_id' => $this->user->id,
            'sequence' => 1,
            'status' => 'pending',
        ]);

        $this->actingAsUser();

        $response = $this->postJson("/api/documents/{$document->id}/approve", [
            'comment' => 'Approved',
        ], $this->withTenantHeaders());

        $response->assertOk();

        $document->refresh();
        $this->assertEquals('finished', $document->status);
        $this->assertNotNull($document->finish_date);
    }

    // ==================== DOWNLOAD TESTS ====================

    public function test_can_get_download_url(): void
    {
        $document = Document::factory()
            ->forTask($this->task)
            ->withFile()
            ->create(['document_type_id' => $this->documentType->id]);

        // Create fake file in storage
        Storage::put($document->document_path, 'test content');

        $this->actingAsUser();

        $response = $this->getJson("/api/documents/{$document->id}/download-url", $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'download_url',
                'expires_at',
            ]);
    }

    public function test_cannot_get_download_url_without_file(): void
    {
        $document = Document::factory()
            ->forTask($this->task)
            ->unstarted()
            ->create(['document_type_id' => $this->documentType->id]);

        $this->actingAsUser();

        $response = $this->getJson("/api/documents/{$document->id}/download-url", $this->withTenantHeaders());

        $response->assertNotFound()
            ->assertJson(['message' => 'Documento sem arquivo.']);
    }

    // ==================== AUTHENTICATION TESTS ====================

    public function test_unauthenticated_user_cannot_access_documents(): void
    {
        $response = $this->getJson('/api/documents');

        $response->assertUnauthorized();
    }
}
