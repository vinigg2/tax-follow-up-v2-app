<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Infrastructure\Persistence\Models\Obligation;
use App\Infrastructure\Persistence\Models\Company;
use App\Infrastructure\Persistence\Models\DocumentType;
use App\Infrastructure\Persistence\Models\Task;
use Mockery;

class ObligationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->createUserWithGroup();
    }

    // ==================== INDEX TESTS ====================

    public function test_can_list_obligations(): void
    {
        Obligation::factory()
            ->count(5)
            ->forGroup($this->group)
            ->create();

        $this->actingAsUser();

        $response = $this->getJson('/api/obligations', $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'obligations',
                'meta' => ['total', 'per_page', 'current_page', 'last_page'],
            ]);
    }

    public function test_can_filter_obligations_by_frequency(): void
    {
        Obligation::factory()->forGroup($this->group)->monthly()->create();
        Obligation::factory()->forGroup($this->group)->quarterly()->create();
        Obligation::factory()->forGroup($this->group)->yearly()->create();

        $this->actingAsUser();

        $response = $this->getJson('/api/obligations?frequency=MM', $this->withTenantHeaders());

        $response->assertOk();
        $obligations = $response->json('obligations');
        $this->assertCount(1, $obligations);
        $this->assertEquals('MM', $obligations[0]['frequency']);
    }

    public function test_can_filter_obligations_by_kind(): void
    {
        Obligation::factory()->forGroup($this->group)->create(['kind' => 'fiscal']);
        Obligation::factory()->forGroup($this->group)->create(['kind' => 'contabil']);

        $this->actingAsUser();

        $response = $this->getJson('/api/obligations?kind=fiscal', $this->withTenantHeaders());

        $response->assertOk();
        $obligations = $response->json('obligations');
        $this->assertCount(1, $obligations);
        $this->assertEquals('fiscal', $obligations[0]['kind']);
    }

    public function test_can_filter_automatic_obligations(): void
    {
        Obligation::factory()->forGroup($this->group)->create(['generate_automatic_tasks' => true]);
        Obligation::factory()->forGroup($this->group)->create(['generate_automatic_tasks' => false]);

        $this->actingAsUser();

        $response = $this->getJson('/api/obligations?automatic_only=true', $this->withTenantHeaders());

        $response->assertOk();
        $obligations = $response->json('obligations');
        $this->assertCount(1, $obligations);
        $this->assertTrue($obligations[0]['generate_automatic_tasks']);
    }

    // ==================== SHOW TESTS ====================

    public function test_can_show_single_obligation(): void
    {
        $obligation = Obligation::factory()
            ->forGroup($this->group)
            ->create();

        DocumentType::factory()
            ->forObligation($obligation)
            ->create();

        $this->actingAsUser();

        $response = $this->getJson("/api/obligations/{$obligation->id}", $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'obligation' => [
                    'id', 'title', 'description', 'frequency', 'kind',
                    'day_deadline', 'group', 'document_types',
                ],
            ]);
    }

    public function test_cannot_show_obligation_from_another_group(): void
    {
        $otherGroup = \App\Infrastructure\Persistence\Models\Group::factory()->create();
        $obligation = Obligation::factory()->forGroup($otherGroup)->create();

        $this->actingAsUser();

        $response = $this->getJson("/api/obligations/{$obligation->id}", $this->withTenantHeaders());

        $response->assertNotFound();
    }

    // ==================== STORE TESTS ====================

    public function test_can_create_obligation(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/obligations', [
            'title' => 'DCTF Mensal',
            'description' => 'Declaracao de Debitos e Creditos Tributarios',
            'frequency' => 'MM',
            'day_deadline' => 15,
            'group_id' => $this->group->id,
            'kind' => 'fiscal',
            'initial_generation_date' => now()->format('Y-m-d'),
            'generate_automatic_tasks' => true,
            'show_dashboard' => true,
        ], $this->withTenantHeaders());

        $response->assertCreated()
            ->assertJson(['message' => 'Obrigacao criada com sucesso!']);

        $this->assertDatabaseHas('obligations', [
            'title' => 'DCTF Mensal',
            'frequency' => 'MM',
            'group_id' => $this->group->id,
        ]);
    }

    public function test_create_obligation_requires_title(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/obligations', [
            'frequency' => 'MM',
            'day_deadline' => 15,
            'group_id' => $this->group->id,
            'kind' => 'fiscal',
            'initial_generation_date' => now()->format('Y-m-d'),
        ], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    public function test_create_obligation_validates_frequency(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/obligations', [
            'title' => 'Test',
            'frequency' => 'INVALID',
            'day_deadline' => 15,
            'group_id' => $this->group->id,
            'kind' => 'fiscal',
            'initial_generation_date' => now()->format('Y-m-d'),
        ], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['frequency']);
    }

    public function test_create_obligation_validates_day_deadline(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/obligations', [
            'title' => 'Test',
            'frequency' => 'MM',
            'day_deadline' => 35, // Invalid day
            'group_id' => $this->group->id,
            'kind' => 'fiscal',
            'initial_generation_date' => now()->format('Y-m-d'),
        ], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['day_deadline']);
    }

    // ==================== UPDATE TESTS ====================

    public function test_can_update_obligation(): void
    {
        $obligation = Obligation::factory()
            ->forGroup($this->group)
            ->create(['title' => 'Old Title']);

        $this->actingAsUser();

        $response = $this->putJson("/api/obligations/{$obligation->id}", [
            'title' => 'New Title',
            'description' => 'Updated description',
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Obrigacao atualizada com sucesso!']);

        $this->assertDatabaseHas('obligations', [
            'id' => $obligation->id,
            'title' => 'New Title',
            'description' => 'Updated description',
        ]);
    }

    public function test_can_update_obligation_frequency(): void
    {
        $obligation = Obligation::factory()
            ->forGroup($this->group)
            ->monthly()
            ->create();

        $this->actingAsUser();

        $response = $this->putJson("/api/obligations/{$obligation->id}", [
            'frequency' => 'QT',
        ], $this->withTenantHeaders());

        $response->assertOk();

        $this->assertDatabaseHas('obligations', [
            'id' => $obligation->id,
            'frequency' => 'QT',
        ]);
    }

    public function test_can_increment_version(): void
    {
        $obligation = Obligation::factory()
            ->forGroup($this->group)
            ->create(['version' => 1]);

        $this->actingAsUser();

        $response = $this->putJson("/api/obligations/{$obligation->id}", [
            'increment_version' => true,
        ], $this->withTenantHeaders());

        $response->assertOk();

        $this->assertDatabaseHas('obligations', [
            'id' => $obligation->id,
            'version' => 2,
        ]);
    }

    // ==================== DELETE TESTS ====================

    public function test_can_delete_obligation(): void
    {
        $obligation = Obligation::factory()
            ->forGroup($this->group)
            ->create();

        $this->actingAsUser();

        $response = $this->deleteJson("/api/obligations/{$obligation->id}", [], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Obrigacao excluida com sucesso!']);

        $this->assertDatabaseHas('obligations', [
            'id' => $obligation->id,
            'deleted' => true,
        ]);
    }

    public function test_deleted_obligations_are_not_listed(): void
    {
        Obligation::factory()->forGroup($this->group)->create(['deleted' => false]);
        Obligation::factory()->forGroup($this->group)->create(['deleted' => true]);

        $this->actingAsUser();

        $response = $this->getJson('/api/obligations', $this->withTenantHeaders());

        $response->assertOk();
        $this->assertCount(1, $response->json('obligations'));
    }

    // ==================== DYNAMIC FIELDS TESTS ====================

    public function test_can_update_dynamic_fields(): void
    {
        $obligation = Obligation::factory()
            ->forGroup($this->group)
            ->create();

        $this->actingAsUser();

        $dynamicFields = [
            'field1' => ['label' => 'Campo 1', 'type' => 'text'],
            'field2' => ['label' => 'Campo 2', 'type' => 'date'],
        ];

        $response = $this->postJson("/api/obligations/{$obligation->id}/dynamic-fields", [
            'dynamic_fields' => $dynamicFields,
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Campos dinamicos atualizados com sucesso!']);

        $obligation->refresh();
        $this->assertEquals($dynamicFields, $obligation->dynamic_fields);
    }

    public function test_can_delete_dynamic_field(): void
    {
        $obligation = Obligation::factory()
            ->forGroup($this->group)
            ->create([
                'dynamic_fields' => [
                    'field1' => ['label' => 'Campo 1'],
                    'field2' => ['label' => 'Campo 2'],
                ],
            ]);

        $this->actingAsUser();

        $response = $this->deleteJson("/api/obligations/{$obligation->id}/dynamic-fields/field1", [], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Campo dinamico removido com sucesso!']);

        $obligation->refresh();
        $this->assertArrayNotHasKey('field1', $obligation->dynamic_fields);
        $this->assertArrayHasKey('field2', $obligation->dynamic_fields);
    }

    // ==================== FLOWCHART TESTS ====================

    public function test_can_update_flowchart(): void
    {
        $obligation = Obligation::factory()
            ->forGroup($this->group)
            ->create();

        $this->actingAsUser();

        $flowchartFields = [
            'step1' => ['label' => 'Etapa 1', 'next' => 'step2'],
            'step2' => ['label' => 'Etapa 2', 'next' => null],
        ];

        $response = $this->postJson("/api/obligations/{$obligation->id}/flowchart", [
            'flowchart_fields' => $flowchartFields,
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Fluxograma atualizado com sucesso!']);

        $obligation->refresh();
        $this->assertEquals($flowchartFields, $obligation->flowchart_fields);
    }

    // ==================== PREVIEW TASKS TESTS ====================

    public function test_can_preview_tasks(): void
    {
        $obligation = Obligation::factory()
            ->forGroup($this->group)
            ->monthly()
            ->create();

        $company = Company::factory()->forGroup($this->group)->create();

        $this->actingAsUser();

        $response = $this->getJson("/api/obligations/{$obligation->id}/preview-tasks?" . http_build_query([
            'company_ids' => [$company->id],
            'start_date' => now()->startOfMonth()->format('Y-m-d'),
            'end_date' => now()->endOfMonth()->format('Y-m-d'),
        ]), $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'preview',
                'competencies',
                'total_new',
                'total_existing',
            ]);
    }

    // ==================== AUTHENTICATION TESTS ====================

    public function test_unauthenticated_user_cannot_access_obligations(): void
    {
        $response = $this->getJson('/api/obligations');

        $response->assertUnauthorized();
    }
}
