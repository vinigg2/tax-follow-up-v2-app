<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\Timeline;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimelineController extends Controller
{
    /**
     * Get timeline entries for a task
     */
    public function index(Request $request, int $taskId): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $task = Task::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($taskId);

        $timeline = Timeline::where('task_id', $taskId)
            ->with('user:id,name,avatar')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($entry) {
                return [
                    'id' => $entry->id,
                    'type' => $entry->type,
                    'type_label' => $this->getTypeLabel($entry->type),
                    'description' => $entry->description,
                    'user' => $entry->user ? [
                        'id' => $entry->user->id,
                        'name' => $entry->user->name,
                        'avatar' => $entry->user->avatar,
                    ] : null,
                    'created_at' => $entry->created_at->format('Y-m-d H:i:s'),
                    'formatted_date' => $entry->created_at->format('d/m/Y H:i'),
                ];
            });

        return response()->json([
            'task_id' => $taskId,
            'timeline' => $timeline,
        ]);
    }

    /**
     * Add a free text entry to the timeline
     */
    public function store(Request $request, int $taskId): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $task = Task::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($taskId);

        $request->validate([
            'description' => 'required|string|max:1000',
        ]);

        $entry = Timeline::createEntry(
            'free_text',
            $taskId,
            $request->user()->id,
            $request->description
        );

        return response()->json([
            'entry' => [
                'id' => $entry->id,
                'type' => $entry->type,
                'type_label' => $this->getTypeLabel($entry->type),
                'description' => $entry->description,
                'user' => [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'avatar' => $request->user()->avatar,
                ],
                'created_at' => $entry->created_at->format('Y-m-d H:i:s'),
                'formatted_date' => $entry->created_at->format('d/m/Y H:i'),
            ],
            'message' => 'Comentario adicionado com sucesso!',
        ], 201);
    }

    /**
     * Get timeline entries by type
     */
    public function byType(Request $request, int $taskId, string $type): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $task = Task::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($taskId);

        $timeline = Timeline::where('task_id', $taskId)
            ->where('type', $type)
            ->with('user:id,name,avatar')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($entry) {
                return [
                    'id' => $entry->id,
                    'type' => $entry->type,
                    'type_label' => $this->getTypeLabel($entry->type),
                    'description' => $entry->description,
                    'user' => $entry->user ? [
                        'id' => $entry->user->id,
                        'name' => $entry->user->name,
                        'avatar' => $entry->user->avatar,
                    ] : null,
                    'created_at' => $entry->created_at->format('Y-m-d H:i:s'),
                    'formatted_date' => $entry->created_at->format('d/m/Y H:i'),
                ];
            });

        return response()->json([
            'task_id' => $taskId,
            'type' => $type,
            'timeline' => $timeline,
        ]);
    }

    // ==================== Private Methods ====================

    private function getTypeLabel(string $type): string
    {
        $labels = [
            'started' => 'Iniciou',
            'finished' => 'Finalizou',
            'send_file' => 'Enviou arquivo',
            'request_approval' => 'Solicitou aprovacao',
            'approved' => 'Aprovou',
            'rejected' => 'Rejeitou',
            'reset_document' => 'Reiniciou documento',
            'correct_task' => 'Retificou tarefa',
            'archived_task' => 'Arquivou tarefa',
            'unarchived_task' => 'Desarquivou tarefa',
            'changed_title' => 'Alterou titulo',
            'changed_description' => 'Alterou descricao',
            'changed_deadline' => 'Alterou prazo',
            'changed_responsible' => 'Alterou responsavel',
            'changed_status' => 'Alterou status',
            'created_task' => 'Criou tarefa',
            'free_text' => 'Comentou',
        ];

        return $labels[$type] ?? $type;
    }
}
