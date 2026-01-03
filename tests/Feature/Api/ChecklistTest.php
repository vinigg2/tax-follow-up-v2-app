<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\Company;
use App\Infrastructure\Persistence\Models\Obligation;
use App\Infrastructure\Persistence\Models\Checklist;
use App\Infrastructure\Persistence\Models\User;

class ChecklistTest extends TestCase
{
    protected Company $company;
    protected Obligation $obligation;
    protected Task $task;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createUserWithGroup();
        $this->company = Company::factory()->forGroup($this->group)->create();
        $this->obligation = Obligation::factory()->forGroup($this->group)->create();
        $this->task = Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->create();
    }

    // ==================== INDEX TESTS ====================

    public function test_can_list_checklists_for_task(): void
    {
        Checklist::factory()
            ->count(3)
            ->forTask($this->task)
            ->create();

        $this->actingAsUser();

        $response = $this->getJson("/api/tasks/{$this->task->id}/checklists", $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'checklists',
                'stats' => ['total', 'completed', 'in_progress', 'pending'],
            ]);

        $this->assertCount(3, $response->json('checklists'));
    }

    public function test_checklists_are_ordered(): void
    {
        Checklist::factory()->forTask($this->task)->create(['order' => 2, 'title' => 'Second']);
        Checklist::factory()->forTask($this->task)->create(['order' => 0, 'title' => 'First']);
        Checklist::factory()->forTask($this->task)->create(['order' => 1, 'title' => 'Middle']);

        $this->actingAsUser();

        $response = $this->getJson("/api/tasks/{$this->task->id}/checklists", $this->withTenantHeaders());

        $response->assertOk();
        $checklists = $response->json('checklists');
        $this->assertEquals('First', $checklists[0]['title']);
        $this->assertEquals('Middle', $checklists[1]['title']);
        $this->assertEquals('Second', $checklists[2]['title']);
    }

    public function test_stats_are_calculated_correctly(): void
    {
        Checklist::factory()->forTask($this->task)->pending()->create();
        Checklist::factory()->forTask($this->task)->pending()->create();
        Checklist::factory()->forTask($this->task)->inProgress()->create();
        Checklist::factory()->forTask($this->task)->completed()->create();

        $this->actingAsUser();

        $response = $this->getJson("/api/tasks/{$this->task->id}/checklists", $this->withTenantHeaders());

        $response->assertOk();
        $stats = $response->json('stats');
        $this->assertEquals(4, $stats['total']);
        $this->assertEquals(1, $stats['completed']);
        $this->assertEquals(1, $stats['in_progress']);
        $this->assertEquals(2, $stats['pending']);
    }

    // ==================== STORE TESTS ====================

    public function test_can_create_checklist_item(): void
    {
        $this->actingAsUser();

        $response = $this->postJson("/api/tasks/{$this->task->id}/checklists", [
            'title' => 'New Checklist Item',
            'description' => 'This is a description',
        ], $this->withTenantHeaders());

        $response->assertCreated()
            ->assertJson(['message' => 'Item adicionado com sucesso.']);

        $this->assertDatabaseHas('checklists', [
            'task_id' => $this->task->id,
            'title' => 'New Checklist Item',
            'status' => 'pendente',
        ]);
    }

    public function test_can_create_checklist_with_assignment(): void
    {
        $assignee = User::factory()->create();

        $this->actingAsUser();

        $response = $this->postJson("/api/tasks/{$this->task->id}/checklists", [
            'title' => 'Assigned Item',
            'assigned_to' => $assignee->id,
        ], $this->withTenantHeaders());

        $response->assertCreated();

        $this->assertDatabaseHas('checklists', [
            'task_id' => $this->task->id,
            'title' => 'Assigned Item',
            'assigned_to' => $assignee->id,
        ]);
    }

    public function test_new_checklist_gets_correct_order(): void
    {
        Checklist::factory()->forTask($this->task)->create(['order' => 0]);
        Checklist::factory()->forTask($this->task)->create(['order' => 1]);

        $this->actingAsUser();

        $response = $this->postJson("/api/tasks/{$this->task->id}/checklists", [
            'title' => 'Third Item',
        ], $this->withTenantHeaders());

        $response->assertCreated();

        $this->assertDatabaseHas('checklists', [
            'task_id' => $this->task->id,
            'title' => 'Third Item',
            'order' => 2,
        ]);
    }

    public function test_create_checklist_requires_title(): void
    {
        $this->actingAsUser();

        $response = $this->postJson("/api/tasks/{$this->task->id}/checklists", [
            'description' => 'No title provided',
        ], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    // ==================== UPDATE TESTS ====================

    public function test_can_update_checklist_item(): void
    {
        $checklist = Checklist::factory()
            ->forTask($this->task)
            ->create(['title' => 'Old Title']);

        $this->actingAsUser();

        $response = $this->putJson("/api/checklists/{$checklist->id}", [
            'title' => 'New Title',
            'description' => 'Updated description',
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Item atualizado com sucesso.']);

        $this->assertDatabaseHas('checklists', [
            'id' => $checklist->id,
            'title' => 'New Title',
            'description' => 'Updated description',
        ]);
    }

    public function test_can_change_checklist_assignment(): void
    {
        $newAssignee = User::factory()->create();

        $checklist = Checklist::factory()
            ->forTask($this->task)
            ->create();

        $this->actingAsUser();

        $response = $this->putJson("/api/checklists/{$checklist->id}", [
            'assigned_to' => $newAssignee->id,
        ], $this->withTenantHeaders());

        $response->assertOk();

        $this->assertDatabaseHas('checklists', [
            'id' => $checklist->id,
            'assigned_to' => $newAssignee->id,
        ]);
    }

    // ==================== DELETE TESTS ====================

    public function test_can_delete_checklist_item(): void
    {
        $checklist = Checklist::factory()
            ->forTask($this->task)
            ->create();

        $this->actingAsUser();

        $response = $this->deleteJson("/api/checklists/{$checklist->id}", [], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Item removido com sucesso.']);

        $this->assertDatabaseMissing('checklists', [
            'id' => $checklist->id,
        ]);
    }

    public function test_delete_reorders_remaining_items(): void
    {
        $item1 = Checklist::factory()->forTask($this->task)->create(['order' => 0]);
        $item2 = Checklist::factory()->forTask($this->task)->create(['order' => 1]);
        $item3 = Checklist::factory()->forTask($this->task)->create(['order' => 2]);

        $this->actingAsUser();

        $response = $this->deleteJson("/api/checklists/{$item2->id}", [], $this->withTenantHeaders());

        $response->assertOk();

        $this->assertEquals(0, $item1->fresh()->order);
        $this->assertEquals(1, $item3->fresh()->order);
    }

    // ==================== STATUS UPDATE TESTS ====================

    public function test_can_mark_checklist_as_completed(): void
    {
        $checklist = Checklist::factory()
            ->forTask($this->task)
            ->pending()
            ->create();

        $this->actingAsUser();

        $response = $this->patchJson("/api/checklists/{$checklist->id}/status", [
            'status' => 'concluido',
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Status atualizado com sucesso.']);

        $checklist->refresh();
        $this->assertEquals('concluido', $checklist->status);
        $this->assertNotNull($checklist->completed_at);
        $this->assertEquals($this->user->id, $checklist->completed_by);
    }

    public function test_can_mark_checklist_as_in_progress(): void
    {
        $checklist = Checklist::factory()
            ->forTask($this->task)
            ->pending()
            ->create();

        $this->actingAsUser();

        $response = $this->patchJson("/api/checklists/{$checklist->id}/status", [
            'status' => 'em_andamento',
        ], $this->withTenantHeaders());

        $response->assertOk();

        $checklist->refresh();
        $this->assertEquals('em_andamento', $checklist->status);
    }

    public function test_can_mark_checklist_as_pending(): void
    {
        $checklist = Checklist::factory()
            ->forTask($this->task)
            ->completed()
            ->create();

        $this->actingAsUser();

        $response = $this->patchJson("/api/checklists/{$checklist->id}/status", [
            'status' => 'pendente',
        ], $this->withTenantHeaders());

        $response->assertOk();

        $checklist->refresh();
        $this->assertEquals('pendente', $checklist->status);
        $this->assertNull($checklist->completed_at);
        $this->assertNull($checklist->completed_by);
    }

    public function test_status_update_requires_valid_status(): void
    {
        $checklist = Checklist::factory()
            ->forTask($this->task)
            ->create();

        $this->actingAsUser();

        $response = $this->patchJson("/api/checklists/{$checklist->id}/status", [
            'status' => 'invalid_status',
        ], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_completing_all_checklists_finishes_task(): void
    {
        $checklist = Checklist::factory()
            ->forTask($this->task)
            ->pending()
            ->create();

        $this->actingAsUser();

        $response = $this->patchJson("/api/checklists/{$checklist->id}/status", [
            'status' => 'concluido',
        ], $this->withTenantHeaders());

        $response->assertOk();

        $this->task->refresh();
        $this->assertEquals(100, $this->task->percent);
        $this->assertEquals('finished', $this->task->status);
    }

    public function test_task_progress_updates_with_checklist_completion(): void
    {
        Checklist::factory()->forTask($this->task)->pending()->create();
        $checklist2 = Checklist::factory()->forTask($this->task)->pending()->create();

        $this->actingAsUser();

        $response = $this->patchJson("/api/checklists/{$checklist2->id}/status", [
            'status' => 'concluido',
        ], $this->withTenantHeaders());

        $response->assertOk();

        $this->task->refresh();
        $this->assertEquals(50, $this->task->percent);
    }

    // ==================== REORDER TESTS ====================

    public function test_can_reorder_checklists(): void
    {
        $item1 = Checklist::factory()->forTask($this->task)->create(['order' => 0]);
        $item2 = Checklist::factory()->forTask($this->task)->create(['order' => 1]);
        $item3 = Checklist::factory()->forTask($this->task)->create(['order' => 2]);

        $this->actingAsUser();

        $response = $this->patchJson("/api/tasks/{$this->task->id}/checklists/reorder", [
            'items' => [
                ['id' => $item3->id, 'order' => 0],
                ['id' => $item1->id, 'order' => 1],
                ['id' => $item2->id, 'order' => 2],
            ],
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Ordem atualizada com sucesso.']);

        $this->assertEquals(1, $item1->fresh()->order);
        $this->assertEquals(2, $item2->fresh()->order);
        $this->assertEquals(0, $item3->fresh()->order);
    }

    public function test_reorder_requires_items_array(): void
    {
        $this->actingAsUser();

        $response = $this->patchJson("/api/tasks/{$this->task->id}/checklists/reorder", [], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['items']);
    }

    // ==================== AUTHENTICATION TESTS ====================

    public function test_unauthenticated_user_cannot_access_checklists(): void
    {
        $response = $this->getJson("/api/tasks/{$this->task->id}/checklists");

        $response->assertUnauthorized();
    }
}
