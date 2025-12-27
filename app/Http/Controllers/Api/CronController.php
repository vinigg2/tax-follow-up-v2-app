<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Application\Services\TaskGenerationService;
use App\Infrastructure\Persistence\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CronController extends Controller
{
    public function __construct(
        private TaskGenerationService $taskGenerationService
    ) {}

    /**
     * Update task status based on deadlines
     */
    public function updateTaskStatus(Request $request): JsonResponse
    {
        $today = now()->startOfDay();
        $pendingThreshold = $today->copy()->addDays(config('taxfollowup.time_to_pending_days', 7));

        // Update late tasks
        $lateCount = Task::where('deleted', false)
            ->where('is_active', true)
            ->whereNotIn('status', ['finished', 'rectified', 'late'])
            ->where('deadline', '<', $today)
            ->update([
                'status' => 'late',
                'delayed_days' => DB::raw("DATEDIFF(NOW(), deadline)"),
            ]);

        // Update pending tasks (deadline within 7 days)
        $pendingCount = Task::where('deleted', false)
            ->where('is_active', true)
            ->where('status', 'new')
            ->whereBetween('deadline', [$today, $pendingThreshold])
            ->update(['status' => 'pending']);

        // Update delayed_days for already late tasks
        Task::where('deleted', false)
            ->where('status', 'late')
            ->update([
                'delayed_days' => DB::raw("DATEDIFF(NOW(), deadline)"),
            ]);

        return response()->json([
            'message' => 'Status das tarefas atualizado',
            'late_count' => $lateCount,
            'pending_count' => $pendingCount,
        ]);
    }

    /**
     * Create automatic tasks based on obligations
     */
    public function createAutomaticTasks(Request $request): JsonResponse
    {
        $results = $this->taskGenerationService->runAutomaticGeneration();

        return response()->json([
            'message' => 'Geracao automatica de tarefas concluida',
            'processed' => $results['processed'],
            'tasks_created' => $results['tasks_created'],
            'errors' => $results['errors'],
        ]);
    }

    /**
     * Send daily notifications
     */
    public function sendDailyNotifications(Request $request): JsonResponse
    {
        // TODO: Implement notification sending
        return response()->json([
            'message' => 'Notificacoes diarias enviadas',
            'count' => 0,
        ]);
    }

    /**
     * Send weekly notifications
     */
    public function sendWeeklyNotifications(Request $request): JsonResponse
    {
        // TODO: Implement notification sending
        return response()->json([
            'message' => 'Notificacoes semanais enviadas',
            'count' => 0,
        ]);
    }

    /**
     * Send monthly notifications
     */
    public function sendMonthlyNotifications(Request $request): JsonResponse
    {
        // TODO: Implement notification sending
        return response()->json([
            'message' => 'Notificacoes mensais enviadas',
            'count' => 0,
        ]);
    }
}
