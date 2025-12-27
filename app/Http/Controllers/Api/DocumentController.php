<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Models\Document;
use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\Timeline;
use App\Infrastructure\Persistence\Models\ApproverSignature;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    /**
     * List all documents for accessible groups
     */
    public function index(Request $request): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $query = Document::with(['task', 'company', 'documentType'])
            ->whereIn('group_id', $groupIds);

        if ($request->filled('task_id')) {
            $query->where('task_id', $request->task_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('company_id')) {
            $query->where('company_id', $request->company_id);
        }

        $documents = $query->orderBy('order_items', 'asc')->paginate(20);

        return response()->json([
            'documents' => $documents->items(),
            'meta' => [
                'total' => $documents->total(),
                'per_page' => $documents->perPage(),
                'current_page' => $documents->currentPage(),
                'last_page' => $documents->lastPage(),
            ],
        ]);
    }

    /**
     * Get a single document with all relations
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $document = Document::with([
            'task',
            'company',
            'documentType',
            'approverSignatures.user',
            'sender',
        ])
            ->whereIn('group_id', $groupIds)
            ->findOrFail($id);

        return response()->json([
            'document' => $document,
        ]);
    }

    /**
     * Upload a file directly
     */
    public function upload(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $document = Document::whereIn('group_id', $groupIds)
            ->findOrFail($id);

        $request->validate([
            'file' => 'required|file|max:51200', // 50MB max
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        $allowedExtensions = config('taxfollowup.upload.allowed_extensions', []);

        if (!in_array(strtolower($extension), $allowedExtensions)) {
            return response()->json([
                'message' => 'Extensao de arquivo nao permitida.',
            ], 422);
        }

        // Generate unique filename
        $filename = sprintf(
            '%s_%s_%s.%s',
            $document->task_id,
            $document->id,
            Str::random(8),
            $extension
        );

        // Store in S3 or local
        $path = $file->storeAs(
            'documents/' . $document->group_id,
            $filename,
            config('filesystems.default')
        );

        $document->update([
            'document_path' => $path,
            'file_size_bytes' => $file->getSize(),
            'submission_date' => now(),
            'sender_id' => $request->user()->id,
            'status' => $document->approval_required === 'N' ? 'finished' : 'on_approval',
        ]);

        // Create timeline entry
        Timeline::createEntry(
            'send_file',
            $document->task_id,
            $request->user()->id,
            "Arquivo enviado: {$file->getClientOriginalName()}",
            $document->id
        );

        // If approval required, create approval signatures
        if ($document->approval_required !== 'N') {
            $this->createApprovalSignatures($document);
            Timeline::createEntry(
                'request_approval',
                $document->task_id,
                $request->user()->id,
                'Solicitada aprovacao do documento',
                $document->id
            );
        } else {
            // Mark as finished
            $document->update([
                'finish_date' => now(),
            ]);
        }

        // Update task status
        $this->updateTaskProgress($document->task);

        return response()->json([
            'document' => $document->fresh()->load(['documentType', 'sender']),
            'message' => 'Arquivo enviado com sucesso!',
        ]);
    }

    /**
     * Get presigned URL for direct S3 upload
     */
    public function getUploadUrl(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $document = Document::whereIn('group_id', $groupIds)
            ->findOrFail($id);

        $request->validate([
            'filename' => 'required|string',
            'content_type' => 'required|string',
        ]);

        $extension = pathinfo($request->filename, PATHINFO_EXTENSION);
        $allowedExtensions = config('taxfollowup.upload.allowed_extensions', []);

        if (!in_array(strtolower($extension), $allowedExtensions)) {
            return response()->json([
                'message' => 'Extensao de arquivo nao permitida.',
            ], 422);
        }

        // Generate unique filename
        $filename = sprintf(
            '%s_%s_%s.%s',
            $document->task_id,
            $document->id,
            Str::random(8),
            $extension
        );

        $path = 'documents/' . $document->group_id . '/' . $filename;

        // Generate presigned URL (for S3)
        if (config('filesystems.default') === 's3') {
            $client = Storage::disk('s3')->getClient();
            $bucket = config('filesystems.disks.s3.bucket');

            $command = $client->getCommand('PutObject', [
                'Bucket' => $bucket,
                'Key' => $path,
                'ContentType' => $request->content_type,
            ]);

            $presignedUrl = $client->createPresignedRequest(
                $command,
                '+' . config('taxfollowup.upload.presigned_url_expiration_minutes', 10) . ' minutes'
            );

            return response()->json([
                'upload_url' => (string) $presignedUrl->getUri(),
                'path' => $path,
                'method' => 'PUT',
            ]);
        }

        // For local storage, return a register URL
        return response()->json([
            'upload_url' => null,
            'path' => $path,
            'message' => 'Local storage - use direct upload instead',
        ]);
    }

    /**
     * Register a completed S3 upload
     */
    public function registerUpload(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $document = Document::whereIn('group_id', $groupIds)
            ->findOrFail($id);

        $request->validate([
            'path' => 'required|string',
            'file_size' => 'required|integer',
            'original_filename' => 'required|string',
        ]);

        $document->update([
            'document_path' => $request->path,
            'file_size_bytes' => $request->file_size,
            'submission_date' => now(),
            'sender_id' => $request->user()->id,
            'status' => $document->approval_required === 'N' ? 'finished' : 'on_approval',
        ]);

        // Create timeline entry
        Timeline::createEntry(
            'send_file',
            $document->task_id,
            $request->user()->id,
            "Arquivo enviado: {$request->original_filename}",
            $document->id
        );

        // If approval required, create approval signatures
        if ($document->approval_required !== 'N') {
            $this->createApprovalSignatures($document);
            Timeline::createEntry(
                'request_approval',
                $document->task_id,
                $request->user()->id,
                'Solicitada aprovacao do documento',
                $document->id
            );
        } else {
            $document->update(['finish_date' => now()]);
        }

        // Update task status
        $this->updateTaskProgress($document->task);

        return response()->json([
            'document' => $document->fresh()->load(['documentType', 'sender']),
            'message' => 'Upload registrado com sucesso!',
        ]);
    }

    /**
     * Reset a document (start over)
     */
    public function reset(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        $document = Document::whereIn('group_id', $groupIds)
            ->findOrFail($id);

        // Delete file if exists
        if ($document->document_path) {
            Storage::delete($document->document_path);
        }

        // Delete approval signatures
        $document->approverSignatures()->delete();

        // Reset document
        $document->update([
            'document_path' => null,
            'file_size_bytes' => null,
            'submission_date' => null,
            'sender_id' => null,
            'status' => 'unstarted',
            'start_date' => null,
            'finish_date' => null,
        ]);

        Timeline::createEntry(
            'reset_document',
            $document->task_id,
            $request->user()->id,
            "Documento '{$document->name}' resetado",
            $document->id
        );

        // Update task status
        $this->updateTaskProgress($document->task);

        return response()->json([
            'document' => $document->fresh(),
            'message' => 'Documento resetado com sucesso!',
        ]);
    }

    /**
     * Approve a document
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);
        $userId = $request->user()->id;

        $document = Document::whereIn('group_id', $groupIds)
            ->findOrFail($id);

        $request->validate([
            'comment' => 'nullable|string|max:500',
        ]);

        // Find pending signature for this user
        $signature = $document->approverSignatures()
            ->where('user_id', $userId)
            ->where('status', 'pending')
            ->first();

        if (!$signature) {
            return response()->json([
                'message' => 'Voce nao tem aprovacao pendente para este documento.',
            ], 403);
        }

        $signature->update([
            'status' => 'signed',
            'signed_at' => now(),
            'comment' => $request->comment,
        ]);

        Timeline::createEntry(
            'approved',
            $document->task_id,
            $userId,
            $request->comment ?? 'Documento aprovado',
            $document->id
        );

        // Check if all approvals are complete
        $this->checkApprovalComplete($document);

        return response()->json([
            'document' => $document->fresh()->load(['approverSignatures.user']),
            'message' => 'Documento aprovado com sucesso!',
        ]);
    }

    /**
     * Reject a document
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);
        $userId = $request->user()->id;

        $document = Document::whereIn('group_id', $groupIds)
            ->findOrFail($id);

        $request->validate([
            'comment' => 'required|string|max:500',
        ]);

        // Find pending signature for this user
        $signature = $document->approverSignatures()
            ->where('user_id', $userId)
            ->where('status', 'pending')
            ->first();

        if (!$signature) {
            return response()->json([
                'message' => 'Voce nao tem aprovacao pendente para este documento.',
            ], 403);
        }

        $signature->update([
            'status' => 'rejected',
            'signed_at' => now(),
            'comment' => $request->comment,
        ]);

        // Mark document as needing restart
        $document->update([
            'status' => 'restarted',
        ]);

        Timeline::createEntry(
            'rejected',
            $document->task_id,
            $userId,
            $request->comment,
            $document->id
        );

        return response()->json([
            'document' => $document->fresh()->load(['approverSignatures.user']),
            'message' => 'Documento rejeitado.',
        ]);
    }

    /**
     * Get download URL for a document
     */
    public function getDownloadUrl(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $document = Document::whereIn('group_id', $groupIds)
            ->findOrFail($id);

        if (!$document->document_path) {
            return response()->json([
                'message' => 'Documento sem arquivo.',
            ], 404);
        }

        // Generate temporary URL
        $url = Storage::temporaryUrl(
            $document->document_path,
            now()->addMinutes(30)
        );

        return response()->json([
            'download_url' => $url,
            'expires_at' => now()->addMinutes(30)->toISOString(),
        ]);
    }

    // ==================== Private Methods ====================

    private function createApprovalSignatures(Document $document): void
    {
        $approvers = $document->documentType->approvers()->orderBy('sequence')->get();

        if ($document->approval_required === 'S') {
            // Sequential - only first approver is pending
            foreach ($approvers as $index => $approver) {
                ApproverSignature::create([
                    'document_id' => $document->id,
                    'user_id' => $approver->user_id,
                    'sequence' => $approver->sequence,
                    'status' => $index === 0 ? 'pending' : null,
                ]);
            }
        } else {
            // Parallel - all approvers are pending
            foreach ($approvers as $approver) {
                ApproverSignature::create([
                    'document_id' => $document->id,
                    'user_id' => $approver->user_id,
                    'sequence' => $approver->sequence,
                    'status' => 'pending',
                ]);
            }
        }
    }

    private function checkApprovalComplete(Document $document): void
    {
        $signatures = $document->approverSignatures()->get();
        $allSigned = $signatures->every(fn($s) => $s->status === 'signed');

        if ($allSigned) {
            $document->update([
                'status' => 'finished',
                'finish_date' => now(),
            ]);

            Timeline::createEntry(
                'finished',
                $document->task_id,
                null,
                "Documento '{$document->name}' finalizado com todas as aprovacoes",
                $document->id
            );

            $this->updateTaskProgress($document->task);
        } elseif ($document->approval_required === 'S') {
            // Sequential - activate next pending
            $nextPending = $signatures->first(fn($s) => $s->status === null);
            if ($nextPending) {
                $nextPending->update(['status' => 'pending']);
            }
        }
    }

    private function updateTaskProgress(Task $task): void
    {
        $obligatoryDocs = $task->documents()->where('is_obligatory', true)->get();

        if ($obligatoryDocs->isEmpty()) {
            return;
        }

        $finishedDocs = $obligatoryDocs->where('status', 'finished');
        $totalDays = $obligatoryDocs->sum('estimated_days');
        $completedDays = $finishedDocs->sum('estimated_days');

        $percent = $totalDays > 0 ? round(($completedDays / $totalDays) * 100, 2) : 0;

        $task->update(['percent' => $percent]);

        // Check if all obligatory documents are finished
        if ($obligatoryDocs->count() === $finishedDocs->count()) {
            $task->update([
                'status' => 'finished',
                'conclusion_date' => now(),
                'percent' => 100,
            ]);
        }
    }
}
