<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\Document;
use App\Infrastructure\Persistence\Models\Timeline;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    /**
     * List all tasks for accessible groups
     */
    public function index(Request $request): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $query = Task::with(['company', 'obligation', 'responsibleUser'])
            ->whereIn('group_id', $groupIds)
            ->where('deleted', false);

        // Filters
        if ($request->filled('company_id')) {
            $query->where('company_id', $request->company_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('responsible')) {
            $query->where('responsible', $request->responsible);
        }

        if ($request->filled('initial_date') && $request->filled('final_date')) {
            $query->whereBetween('deadline', [$request->initial_date, $request->final_date]);
        }

        // By default, show only active (not archived) tasks
        if (!$request->boolean('show_archived')) {
            $query->where('is_active', true);
        }

        // By default, hide completed tasks unless requested
        if (!$request->boolean('show_completed')) {
            $query->whereNotIn('status', ['finished', 'rectified']);
        }

        $tasks = $query->orderBy('deadline', 'asc')->paginate(20);

        return response()->json([
            'tasks' => $tasks->items(),
            'meta' => [
                'total' => $tasks->total(),
                'per_page' => $tasks->perPage(),
                'current_page' => $tasks->currentPage(),
                'last_page' => $tasks->lastPage(),
            ],
        ]);
    }

    /**
     * Get tasks by specific method/filter
     */
    public function byMethod(Request $request, string $method): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);
        $userId = $request->user()->id;

        $tasks = match ($method) {
            'currentIteration' => $this->getCurrentIteration($groupIds, $request),
            'myTasks' => $this->getMyTasks($userId, $groupIds),
            'myApprovals' => $this->getMyApprovals($userId, $groupIds),
            'archivedTasks' => $this->getArchivedTasks($groupIds),
            'delayedTasks' => $this->getDelayedTasks($groupIds),
            'byTeams', 'times' => $this->getTasksByTeams($groupIds),
            'byCompanies', 'companies' => $this->getTasksByCompanies($groupIds, $request),
            'byStatus', 'status' => $this->getTasksByStatus($groupIds),
            'byUsers', 'users' => $this->getTasksByUsers($groupIds),
            'byDeadline', 'deadline' => $this->getTasksByDeadline($groupIds),
            'byMonth', 'month' => $this->getTasksByMonth($groupIds, $request),
            default => collect(),
        };

        return response()->json([
            'tasks' => $tasks,
            'method' => $method,
        ]);
    }

    /**
     * Get a single task with all relations
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $task = Task::with([
            'company',
            'group',
            'obligation',
            'responsibleUser',
            'documents.approverSignatures.user',
            'documents.documentType',
            'correctedTask',
            'corrections',
        ])
            ->whereIn('group_id', $groupIds)
            ->findOrFail($id);

        return response()->json([
            'task' => $task,
        ]);
    }

    /**
     * Create a new task
     */
    public function store(Request $request): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        $request->validate([
            'title' => 'required|string|max:30',
            'description' => 'nullable|string|max:250',
            'deadline' => 'required|date',
            'company_id' => 'required|exists:companies,id',
            'group_id' => 'required|integer|in:' . implode(',', $groupIds),
            'responsible_user_id' => 'nullable|exists:users,id',
            'obligation_id' => 'nullable|exists:obligations,id',
            'competency' => 'nullable|string|max:10',
        ]);

        DB::beginTransaction();

        try {
            $task = Task::create([
                'title' => $request->title,
                'description' => $request->description,
                'deadline' => $request->deadline,
                'company_id' => $request->company_id,
                'group_id' => $request->group_id,
                'responsible' => $request->responsible_user_id,
                'cause_id' => $request->obligation_id,
                'competency' => $request->competency,
                'status' => 'new',
                'is_active' => true,
                'percent' => 0,
                'delayed_days' => 0,
            ]);

            // Create timeline entry
            Timeline::createEntry(
                'created_task',
                $task->id,
                $request->user()->id,
                'Tarefa criada'
            );

            DB::commit();

            return response()->json([
                'task' => $task->load(['company', 'responsibleUser']),
                'message' => 'Tarefa criada com sucesso!',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update a task
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        $task = Task::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $request->validate([
            'title' => 'sometimes|string|max:30',
            'description' => 'sometimes|nullable|string|max:250',
            'deadline' => 'sometimes|date',
            'responsible' => 'sometimes|nullable|exists:users,id',
            'status' => 'sometimes|string|in:new,pending,late,finished',
        ]);

        $oldValues = $task->only(['title', 'description', 'deadline', 'responsible', 'status']);
        $user = $request->user();

        // Handle status change (from Kanban drag & drop)
        if ($request->filled('status') && $oldValues['status'] !== $request->status) {
            // Prevent changing rectified tasks
            if ($oldValues['status'] === 'rectified') {
                return response()->json([
                    'message' => 'Tarefas retificadas nao podem ter o status alterado',
                ], 422);
            }

            $statusLabels = [
                'new' => 'Nova',
                'pending' => 'Pendente',
                'late' => 'Atrasada',
                'finished' => 'Finalizada',
            ];

            $task->update(['status' => $request->status]);

            // If marked as finished, set conclusion date
            if ($request->status === 'finished') {
                $task->update([
                    'conclusion_date' => now(),
                    'percent' => 100,
                ]);
            }

            $oldStatusLabel = $statusLabels[$oldValues['status']] ?? $oldValues['status'];
            $newStatusLabel = $statusLabels[$request->status] ?? $request->status;

            Timeline::createEntry(
                'changed_status',
                $task->id,
                $user->id,
                "Status alterado de '{$oldStatusLabel}' para '{$newStatusLabel}'"
            );

            return response()->json([
                'task' => $task->fresh()->load(['company', 'responsibleUser', 'documents']),
                'message' => 'Status atualizado com sucesso!',
            ]);
        }

        $task->update($request->only(['title', 'description', 'deadline', 'responsible']));

        // Create timeline entries for other changes
        if ($request->filled('title') && $oldValues['title'] !== $request->title) {
            Timeline::createEntry('changed_title', $task->id, $user->id, "Titulo alterado de '{$oldValues['title']}' para '{$request->title}'");
        }

        if ($request->filled('description') && $oldValues['description'] !== $request->description) {
            Timeline::createEntry('changed_description', $task->id, $user->id, 'Descricao alterada');
        }

        if ($request->filled('deadline') && $oldValues['deadline']?->format('Y-m-d') !== $request->deadline) {
            Timeline::createEntry('changed_deadline', $task->id, $user->id, "Prazo alterado para {$request->deadline}");
        }

        if ($request->filled('responsible') && $oldValues['responsible'] !== $request->responsible) {
            $newResponsible = $task->fresh()->responsibleUser;
            Timeline::createEntry('changed_responsible', $task->id, $user->id, "Responsavel alterado para {$newResponsible?->name}");
        }

        // Recalculate status only if not explicitly set
        if (!$request->filled('status')) {
            $this->updateTaskStatus($task);
        }

        return response()->json([
            'task' => $task->fresh()->load(['company', 'responsibleUser', 'documents']),
            'message' => 'Tarefa atualizada com sucesso!',
        ]);
    }

    /**
     * Create a correction task (rectify)
     */
    public function correct(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        $task = Task::with(['documents.documentType', 'obligation'])
            ->whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $request->validate([
            'deadline' => 'required|date|after:today',
        ]);

        DB::beginTransaction();

        try {
            // Mark original task as rectified
            $task->update(['status' => 'rectified']);

            // Create correction task
            $correctionTask = Task::create([
                'title' => $task->title,
                'description' => $task->description,
                'deadline' => $request->deadline,
                'status' => 'new',
                'cause_id' => $task->cause_id,
                'cause_version' => $task->cause_version,
                'company_id' => $task->company_id,
                'group_id' => $task->group_id,
                'responsible' => $task->responsible,
                'task_corrected' => $task->id,
                'competency' => $task->competency,
                'dynamic_fields' => $task->dynamic_fields,
                'flowchart_fields' => $task->flowchart_fields,
            ]);

            // Clone documents for the new task
            foreach ($task->documents as $document) {
                Document::create([
                    'name' => $document->name,
                    'description' => $document->description,
                    'document_type_id' => $document->document_type_id,
                    'task_id' => $correctionTask->id,
                    'company_id' => $document->company_id,
                    'group_id' => $document->group_id,
                    'status' => 'unstarted',
                    'is_obligatory' => $document->is_obligatory,
                    'estimated_days' => $document->estimated_days,
                    'required_file' => $document->required_file,
                    'approval_required' => $document->approval_required,
                    'order_items' => $document->order_items,
                ]);
            }

            // Create timeline entry
            Timeline::createEntry(
                'correct_task',
                $task->id,
                $request->user()->id,
                "Tarefa retificada. Nova tarefa #{$correctionTask->id} criada com prazo {$request->deadline}"
            );

            DB::commit();

            return response()->json([
                'task' => $correctionTask->load(['company', 'responsibleUser', 'documents']),
                'original_task' => $task->fresh(),
                'message' => 'Tarefa de retificacao criada com sucesso!',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Archive a task
     */
    public function archive(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        $task = Task::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $task->update(['is_active' => false]);

        Timeline::createEntry('archived_task', $task->id, $request->user()->id, 'Tarefa arquivada');

        return response()->json([
            'task' => $task->fresh(),
            'message' => 'Tarefa arquivada com sucesso!',
        ]);
    }

    /**
     * Unarchive a task
     */
    public function unarchive(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        $task = Task::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $task->update(['is_active' => true]);

        Timeline::createEntry('unarchived_task', $task->id, $request->user()->id, 'Tarefa desarquivada');

        return response()->json([
            'task' => $task->fresh(),
            'message' => 'Tarefa desarquivada com sucesso!',
        ]);
    }

    // ==================== Private Methods ====================

    private function getCurrentIteration(array $groupIds, Request $request)
    {
        $query = Task::with(['company', 'responsibleUser'])
            ->whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', true);

        // By default exclude completed tasks, unless show_completed is true
        if (!$request->boolean('show_completed')) {
            $query->whereNotIn('status', ['finished', 'rectified']);
        } else {
            // When showing completed, only show recently completed (last 30 days)
            $query->where(function ($q) {
                $q->whereNotIn('status', ['finished', 'rectified'])
                    ->orWhere(function ($q2) {
                        $q2->whereIn('status', ['finished', 'rectified'])
                            ->where('updated_at', '>=', now()->subDays(30));
                    });
            });
        }

        return $query->orderBy('deadline', 'asc')
            ->limit(100)
            ->get();
    }

    private function getMyTasks(int $userId, array $groupIds)
    {
        return Task::with(['company', 'responsibleUser'])
            ->whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', true)
            ->where('responsible', $userId)
            ->whereNotIn('status', ['finished', 'rectified'])
            ->orderBy('deadline', 'asc')
            ->get();
    }

    private function getMyApprovals(int $userId, array $groupIds)
    {
        return Task::with(['company', 'responsibleUser', 'documents.approverSignatures'])
            ->whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', true)
            ->whereHas('documents.approverSignatures', function ($query) use ($userId) {
                $query->where('user_id', $userId)
                    ->where('status', 'pending');
            })
            ->orderBy('deadline', 'asc')
            ->get();
    }

    private function getArchivedTasks(array $groupIds)
    {
        return Task::with(['company', 'responsibleUser'])
            ->whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', false)
            ->orderBy('updated_at', 'desc')
            ->limit(50)
            ->get();
    }

    private function getDelayedTasks(array $groupIds)
    {
        return Task::with(['company', 'responsibleUser'])
            ->whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', true)
            ->where('status', 'late')
            ->orderBy('deadline', 'asc')
            ->get();
    }

    private function getTasksByTeams(array $groupIds)
    {
        return Task::with(['company', 'group'])
            ->whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', true)
            ->whereNotIn('status', ['finished', 'rectified'])
            ->get()
            ->groupBy('group_id')
            ->map(function ($tasks, $groupId) {
                return [
                    'group_id' => $groupId,
                    'group_name' => $tasks->first()->group->name,
                    'total' => $tasks->count(),
                    'by_status' => $tasks->groupBy('status')->map->count(),
                ];
            })
            ->values();
    }

    private function getTasksByCompanies(array $groupIds, Request $request)
    {
        $query = Task::with(['company'])
            ->whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', true)
            ->whereNotIn('status', ['finished', 'rectified']);

        if ($request->filled('group_id')) {
            $query->where('group_id', $request->group_id);
        }

        return $query->get()
            ->groupBy('company_id')
            ->map(function ($tasks, $companyId) {
                return [
                    'company_id' => $companyId,
                    'company_name' => $tasks->first()->company->name,
                    'total' => $tasks->count(),
                    'by_status' => $tasks->groupBy('status')->map->count(),
                ];
            })
            ->values();
    }

    private function getTasksByStatus(array $groupIds)
    {
        return Task::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', true)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->get();
    }

    private function getTasksByUsers(array $groupIds)
    {
        return Task::with(['company', 'responsibleUser'])
            ->whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', true)
            ->whereNotIn('status', ['finished', 'rectified'])
            ->get()
            ->groupBy('responsible')
            ->map(function ($tasks, $responsibleId) {
                $user = $tasks->first()->responsibleUser;
                return [
                    'user_id' => $responsibleId,
                    'user_name' => $user?->name ?? 'Nao atribuido',
                    'total' => $tasks->count(),
                    'by_status' => $tasks->groupBy('status')->map->count(),
                    'tasks' => $tasks,
                ];
            })
            ->values();
    }

    private function getTasksByDeadline(array $groupIds)
    {
        return Task::with(['company', 'responsibleUser'])
            ->whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', true)
            ->whereNotIn('status', ['finished', 'rectified'])
            ->orderBy('deadline', 'asc')
            ->get()
            ->groupBy(fn($task) => $task->deadline->format('Y-m-d'))
            ->map(function ($tasks, $date) {
                return [
                    'deadline' => $date,
                    'total' => $tasks->count(),
                    'tasks' => $tasks,
                ];
            })
            ->values();
    }

    private function getTasksByMonth(array $groupIds, Request $request)
    {
        $query = Task::with(['company', 'responsibleUser'])
            ->whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', true)
            ->whereNotIn('status', ['finished', 'rectified']);

        if ($request->filled('month')) {
            $month = $request->month; // Format: YYYY-MM
            $query->whereRaw("DATE_FORMAT(deadline, '%Y-%m') = ?", [$month]);
        }

        return $query->orderBy('deadline', 'asc')
            ->get()
            ->groupBy(fn($task) => $task->deadline->format('Y-m'))
            ->map(function ($tasks, $month) {
                return [
                    'month' => $month,
                    'total' => $tasks->count(),
                    'by_status' => $tasks->groupBy('status')->map->count(),
                    'tasks' => $tasks,
                ];
            })
            ->values();
    }

    private function updateTaskStatus(Task $task): void
    {
        $today = now()->startOfDay();
        $deadline = $task->deadline;
        $daysUntilDeadline = $today->diffInDays($deadline, false);

        // Check if all obligatory documents are finished
        $obligatoryDocs = $task->documents()->where('is_obligatory', true)->get();
        $allDocsFinished = $obligatoryDocs->isEmpty() || $obligatoryDocs->every(fn($doc) => $doc->status === 'finished');

        if ($allDocsFinished && $obligatoryDocs->isNotEmpty()) {
            $task->update([
                'status' => 'finished',
                'conclusion_date' => now(),
                'percent' => 100,
            ]);
            return;
        }

        // Calculate progress
        $totalDays = $obligatoryDocs->sum('estimated_days');
        $completedDays = $obligatoryDocs->where('status', 'finished')->sum('estimated_days');
        $percent = $totalDays > 0 ? round(($completedDays / $totalDays) * 100, 2) : 0;

        // Determine status based on deadline
        $status = $task->status;

        if ($deadline->isPast() && !in_array($status, ['finished', 'rectified'])) {
            $status = 'late';
            $delayedDays = $today->diffInDays($deadline);
        } elseif ($daysUntilDeadline <= 7 && $status === 'new') {
            $status = 'pending';
            $delayedDays = 0;
        } else {
            $delayedDays = 0;
        }

        $task->update([
            'status' => $status,
            'percent' => $percent,
            'delayed_days' => $delayedDays ?? 0,
        ]);
    }
}
