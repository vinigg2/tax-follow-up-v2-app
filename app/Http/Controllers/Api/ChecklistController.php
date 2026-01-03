<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Models\Checklist;
use App\Infrastructure\Persistence\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChecklistController extends Controller
{
    /**
     * Get all checklists for a task
     */
    public function index(Task $task): JsonResponse
    {
        $checklists = $task->checklists()
            ->with(['assignedUser:id,name,avatar', 'completedByUser:id,name'])
            ->ordered()
            ->get();

        return response()->json([
            'checklists' => $checklists,
            'stats' => [
                'total' => $checklists->count(),
                'completed' => $checklists->where('status', 'concluido')->count(),
                'in_progress' => $checklists->where('status', 'em_andamento')->count(),
                'pending' => $checklists->where('status', 'pendente')->count(),
            ],
        ]);
    }

    /**
     * Create a new checklist item
     */
    public function store(Request $request, Task $task): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        // Get the max order for this task
        $maxOrder = $task->checklists()->max('order') ?? -1;

        $checklist = $task->checklists()->create([
            'title' => $request->title,
            'description' => $request->description,
            'assigned_to' => $request->assigned_to,
            'order' => $maxOrder + 1,
            'status' => Checklist::STATUS_PENDENTE,
        ]);

        $checklist->load(['assignedUser:id,name,avatar']);

        // Update task progress
        $this->updateTaskProgress($task);

        return response()->json([
            'checklist' => $checklist,
            'message' => 'Item adicionado com sucesso.',
        ], 201);
    }

    /**
     * Update a checklist item
     */
    public function update(Request $request, Checklist $checklist): JsonResponse
    {
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $checklist->update($request->only(['title', 'description', 'assigned_to']));

        $checklist->load(['assignedUser:id,name,avatar', 'completedByUser:id,name']);

        return response()->json([
            'checklist' => $checklist,
            'message' => 'Item atualizado com sucesso.',
        ]);
    }

    /**
     * Delete a checklist item
     */
    public function destroy(Checklist $checklist): JsonResponse
    {
        $task = $checklist->task;
        $checklist->delete();

        // Reorder remaining items
        $task->checklists()->ordered()->get()->each(function ($item, $index) {
            $item->update(['order' => $index]);
        });

        // Update task progress
        $this->updateTaskProgress($task);

        return response()->json([
            'message' => 'Item removido com sucesso.',
        ]);
    }

    /**
     * Update checklist status
     */
    public function updateStatus(Request $request, Checklist $checklist): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pendente,em_andamento,concluido',
        ]);

        $status = $request->status;
        $user = $request->user();

        if ($status === Checklist::STATUS_CONCLUIDO) {
            $checklist->markAsCompleted($user->id);
        } elseif ($status === Checklist::STATUS_EM_ANDAMENTO) {
            $checklist->markAsInProgress();
        } else {
            $checklist->markAsPending();
        }

        $checklist->load(['assignedUser:id,name,avatar', 'completedByUser:id,name']);

        // Update task progress
        $this->updateTaskProgress($checklist->task);

        return response()->json([
            'checklist' => $checklist,
            'message' => 'Status atualizado com sucesso.',
        ]);
    }

    /**
     * Reorder checklists
     */
    public function reorder(Request $request, Task $task): JsonResponse
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:checklists,id',
            'items.*.order' => 'required|integer|min:0',
        ]);

        foreach ($request->items as $item) {
            Checklist::where('id', $item['id'])
                ->where('task_id', $task->id)
                ->update(['order' => $item['order']]);
        }

        $checklists = $task->checklists()
            ->with(['assignedUser:id,name,avatar', 'completedByUser:id,name'])
            ->ordered()
            ->get();

        return response()->json([
            'checklists' => $checklists,
            'message' => 'Ordem atualizada com sucesso.',
        ]);
    }

    /**
     * Update task progress based on checklists
     */
    private function updateTaskProgress(Task $task): void
    {
        $total = $task->checklists()->count();

        if ($total === 0) {
            $task->update(['percent' => 0]);
            return;
        }

        $completed = $task->checklists()->completed()->count();
        $percent = (int) round(($completed / $total) * 100);

        $task->update(['percent' => $percent]);

        // Update task status if all checklists are completed
        if ($percent >= 100 && $task->status !== 'finished') {
            $task->update([
                'status' => 'finished',
                'conclusion_date' => now(),
            ]);
        }
    }
}
