<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\Company;
use App\Infrastructure\Persistence\Models\Obligation;
use App\Infrastructure\Persistence\Models\User;
use App\Infrastructure\Persistence\Models\Document;

class TaskTest extends TestCase
{
    protected Company $company;
    protected Obligation $obligation;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createUserWithGroup();
        $this->company = Company::factory()->forGroup($this->group)->create();
        $this->obligation = Obligation::factory()->forGroup($this->group)->create();
    }

    // ==================== INDEX TESTS ====================

    public function test_can_list_tasks(): void
    {
        Task::factory()->count(5)
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->create();

        $this->actingAsUser();

        $response = $this->getJson('/api/tasks', $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'tasks',
                'meta' => ['total', 'per_page', 'current_page', 'last_page'],
            ]);
    }

    public function test_can_filter_tasks_by_company(): void
    {
        $company2 = Company::factory()->forGroup($this->group)->create();

        Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->pending()
            ->create(['title' => 'Task Company 1']);

        Task::factory()
            ->forGroup($this->group)
            ->forCompany($company2)
            ->forObligation($this->obligation)
            ->pending()
            ->create(['title' => 'Task Company 2']);

        $this->actingAsUser();

        $response = $this->getJson("/api/tasks?company_id={$this->company->id}", $this->withTenantHeaders());

        $response->assertOk();
        $tasks = $response->json('tasks');
        $this->assertCount(1, $tasks);
        $this->assertEquals('Task Company 1', $tasks[0]['title']);
    }

    public function test_can_filter_tasks_by_status(): void
    {
        Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->pending()
            ->create();

        Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->inProgress()
            ->create();

        $this->actingAsUser();

        $response = $this->getJson('/api/tasks?status=pending', $this->withTenantHeaders());

        $response->assertOk();
        $tasks = $response->json('tasks');
        $this->assertCount(1, $tasks);
        $this->assertEquals('pending', $tasks[0]['status']);
    }

    public function test_can_filter_tasks_by_responsible(): void
    {
        $anotherUser = User::factory()->create();

        Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->assignedTo($this->user)
            ->pending()
            ->create();

        Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->assignedTo($anotherUser)
            ->pending()
            ->create();

        $this->actingAsUser();

        $response = $this->getJson("/api/tasks?responsible={$this->user->id}", $this->withTenantHeaders());

        $response->assertOk();
        $tasks = $response->json('tasks');
        $this->assertCount(1, $tasks);
    }

    public function test_archived_tasks_are_hidden_by_default(): void
    {
        Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->pending()
            ->create(['title' => 'Active Task']);

        Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->archived()
            ->create(['title' => 'Archived Task']);

        $this->actingAsUser();

        $response = $this->getJson('/api/tasks', $this->withTenantHeaders());

        $response->assertOk();
        $tasks = $response->json('tasks');
        $this->assertCount(1, $tasks);
        $this->assertEquals('Active Task', $tasks[0]['title']);
    }

    public function test_can_show_archived_tasks(): void
    {
        Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->archived()
            ->pending()
            ->create();

        $this->actingAsUser();

        $response = $this->getJson('/api/tasks?show_archived=true&show_completed=true', $this->withTenantHeaders());

        $response->assertOk();
        $tasks = $response->json('tasks');
        $this->assertCount(1, $tasks);
    }

    // ==================== SHOW TESTS ====================

    public function test_can_show_single_task(): void
    {
        $task = Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->create();

        $this->actingAsUser();

        $response = $this->getJson("/api/tasks/{$task->id}", $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'task' => [
                    'id', 'title', 'description', 'status', 'deadline',
                    'company', 'group', 'obligation', 'responsible_user',
                ],
            ]);
    }

    public function test_cannot_show_task_from_another_group(): void
    {
        $otherGroup = \App\Infrastructure\Persistence\Models\Group::factory()->create();
        $otherCompany = Company::factory()->forGroup($otherGroup)->create();
        $otherObligation = Obligation::factory()->forGroup($otherGroup)->create();

        $task = Task::factory()
            ->forGroup($otherGroup)
            ->forCompany($otherCompany)
            ->forObligation($otherObligation)
            ->create();

        $this->actingAsUser();

        $response = $this->getJson("/api/tasks/{$task->id}", $this->withTenantHeaders());

        $response->assertNotFound();
    }

    // ==================== UPDATE TESTS ====================

    public function test_can_update_task(): void
    {
        $task = Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->create(['title' => 'Old Title']);

        $this->actingAsUser();

        $response = $this->putJson("/api/tasks/{$task->id}", [
            'title' => 'New Title',
            'description' => 'Updated description',
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Tarefa atualizada com sucesso!']);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => 'New Title',
            'description' => 'Updated description',
        ]);
    }

    public function test_can_update_task_deadline(): void
    {
        $task = Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->create();

        $newDeadline = now()->addDays(15)->format('Y-m-d');

        $this->actingAsUser();

        $response = $this->putJson("/api/tasks/{$task->id}", [
            'deadline' => $newDeadline,
        ], $this->withTenantHeaders());

        $response->assertOk();

        $task->refresh();
        $this->assertEquals($newDeadline, $task->deadline->format('Y-m-d'));
    }

    public function test_can_change_task_responsible(): void
    {
        $newUser = User::factory()->create();

        $task = Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->assignedTo($this->user)
            ->create();

        $this->actingAsUser();

        $response = $this->putJson("/api/tasks/{$task->id}", [
            'responsible' => $newUser->id,
        ], $this->withTenantHeaders());

        $response->assertOk();

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'responsible' => $newUser->id,
        ]);
    }

    public function test_update_creates_timeline_entry(): void
    {
        $task = Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->create(['title' => 'Old Title']);

        $this->actingAsUser();

        $response = $this->putJson("/api/tasks/{$task->id}", [
            'title' => 'New Title',
        ], $this->withTenantHeaders());

        $response->assertOk();

        $this->assertDatabaseHas('timelines', [
            'task_id' => $task->id,
            'type' => 'changed_title',
        ]);
    }

    // ==================== CORRECT (RECTIFY) TESTS ====================

    public function test_can_create_correction_task(): void
    {
        $task = Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->create(['status' => 'finished']);

        $this->actingAsUser();

        $newDeadline = now()->addDays(10)->format('Y-m-d');

        $response = $this->postJson("/api/tasks/{$task->id}/correct", [
            'deadline' => $newDeadline,
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Tarefa de retificacao criada com sucesso!']);

        // Original task should be marked as rectified
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'status' => 'rectified',
        ]);

        // New correction task should exist
        $this->assertDatabaseHas('tasks', [
            'task_corrected' => $task->id,
        ]);
    }

    public function test_correction_task_copies_documents(): void
    {
        $task = Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->create(['status' => 'finished']);

        Document::factory()->forTask($task)->create(['name' => 'Doc 1']);
        Document::factory()->forTask($task)->create(['name' => 'Doc 2']);

        $this->actingAsUser();

        $newDeadline = now()->addDays(10)->format('Y-m-d');

        $response = $this->postJson("/api/tasks/{$task->id}/correct", [
            'deadline' => $newDeadline,
        ], $this->withTenantHeaders());

        $response->assertOk();

        $correctionTask = Task::where('task_corrected', $task->id)->first();
        $this->assertCount(2, $correctionTask->documents);
    }

    public function test_correction_requires_future_deadline(): void
    {
        $task = Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->create();

        $this->actingAsUser();

        $pastDeadline = now()->subDay()->format('Y-m-d');

        $response = $this->postJson("/api/tasks/{$task->id}/correct", [
            'deadline' => $pastDeadline,
        ], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['deadline']);
    }

    // ==================== ARCHIVE TESTS ====================

    public function test_can_archive_task(): void
    {
        $task = Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->create(['is_active' => true]);

        $this->actingAsUser();

        $response = $this->postJson("/api/tasks/{$task->id}/archive", [], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Tarefa arquivada com sucesso!']);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'is_active' => false,
        ]);

        // Should create timeline entry
        $this->assertDatabaseHas('timelines', [
            'task_id' => $task->id,
            'type' => 'archived_task',
        ]);
    }

    public function test_can_unarchive_task(): void
    {
        $task = Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->archived()
            ->create();

        $this->actingAsUser();

        $response = $this->postJson("/api/tasks/{$task->id}/unarchive", [], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJson(['message' => 'Tarefa desarquivada com sucesso!']);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'is_active' => true,
        ]);

        // Should create timeline entry
        $this->assertDatabaseHas('timelines', [
            'task_id' => $task->id,
            'type' => 'unarchived_task',
        ]);
    }

    // ==================== BY METHOD TESTS ====================

    public function test_can_get_current_iteration_tasks(): void
    {
        Task::factory()
            ->count(3)
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->pending()
            ->create();

        $this->actingAsUser();

        $response = $this->getJson('/api/tasks/method/currentIteration', $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'tasks',
                'method',
            ]);
        $this->assertCount(3, $response->json('tasks'));
    }

    public function test_can_get_my_tasks(): void
    {
        $anotherUser = User::factory()->create();

        Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->assignedTo($this->user)
            ->pending()
            ->create();

        Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->assignedTo($anotherUser)
            ->pending()
            ->create();

        $this->actingAsUser();

        $response = $this->getJson('/api/tasks/method/myTasks', $this->withTenantHeaders());

        $response->assertOk();
        $this->assertCount(1, $response->json('tasks'));
    }

    public function test_can_get_delayed_tasks(): void
    {
        Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->late()
            ->create();

        Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->pending()
            ->create();

        $this->actingAsUser();

        $response = $this->getJson('/api/tasks/method/delayedTasks', $this->withTenantHeaders());

        $response->assertOk();
        $this->assertCount(1, $response->json('tasks'));
    }

    public function test_can_get_archived_tasks(): void
    {
        Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->archived()
            ->create();

        $this->actingAsUser();

        $response = $this->getJson('/api/tasks/method/archivedTasks', $this->withTenantHeaders());

        $response->assertOk();
        $this->assertCount(1, $response->json('tasks'));
    }

    public function test_can_get_tasks_by_status(): void
    {
        Task::factory()
            ->count(2)
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->pending()
            ->create();

        Task::factory()
            ->forGroup($this->group)
            ->forCompany($this->company)
            ->forObligation($this->obligation)
            ->inProgress()
            ->create();

        $this->actingAsUser();

        $response = $this->getJson('/api/tasks/method/byStatus', $this->withTenantHeaders());

        $response->assertOk();
    }

    // ==================== AUTHENTICATION TESTS ====================

    public function test_unauthenticated_user_cannot_access_tasks(): void
    {
        $response = $this->getJson('/api/tasks');

        $response->assertUnauthorized();
    }
}
