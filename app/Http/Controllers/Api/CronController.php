<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Application\Services\TaskGenerationService;
use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\User;
use App\Notifications\DailySummaryNotification;
use App\Notifications\TaskDeadlineNotification;
use App\Notifications\WeeklySummaryNotification;
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
        $users = User::where('daily_notifications', true)
            ->where('is_active', true)
            ->get();

        $sentCount = 0;
        $today = now()->startOfDay();
        $weekFromNow = now()->addDays(7)->endOfDay();

        foreach ($users as $user) {
            $groupIds = $user->accessibleGroupIds();

            if (empty($groupIds)) {
                continue;
            }

            // Get overdue tasks
            $overdueTasks = Task::whereIn('group_id', $groupIds)
                ->where('responsible', $user->id)
                ->where('deleted', false)
                ->where('is_active', true)
                ->where('status', 'late')
                ->orderBy('deadline')
                ->get();

            // Get tasks due today
            $dueTodayTasks = Task::whereIn('group_id', $groupIds)
                ->where('responsible', $user->id)
                ->where('deleted', false)
                ->where('is_active', true)
                ->whereNotIn('status', ['finished', 'rectified'])
                ->whereDate('deadline', $today)
                ->orderBy('deadline')
                ->get();

            // Get upcoming tasks (next 7 days)
            $upcomingTasks = Task::whereIn('group_id', $groupIds)
                ->where('responsible', $user->id)
                ->where('deleted', false)
                ->where('is_active', true)
                ->whereNotIn('status', ['finished', 'rectified', 'late'])
                ->whereBetween('deadline', [$today->copy()->addDay(), $weekFromNow])
                ->orderBy('deadline')
                ->get();

            // Skip if no relevant tasks
            if ($overdueTasks->isEmpty() && $dueTodayTasks->isEmpty() && $upcomingTasks->isEmpty()) {
                continue;
            }

            // Calculate stats
            $stats = [
                'total' => Task::whereIn('group_id', $groupIds)
                    ->where('responsible', $user->id)
                    ->where('deleted', false)
                    ->where('is_active', true)
                    ->count(),
                'completed' => Task::whereIn('group_id', $groupIds)
                    ->where('responsible', $user->id)
                    ->where('deleted', false)
                    ->whereIn('status', ['finished', 'rectified'])
                    ->count(),
                'in_progress' => Task::whereIn('group_id', $groupIds)
                    ->where('responsible', $user->id)
                    ->where('deleted', false)
                    ->where('is_active', true)
                    ->whereNotIn('status', ['finished', 'rectified', 'new'])
                    ->count(),
            ];

            $user->notify(new DailySummaryNotification(
                $overdueTasks,
                $dueTodayTasks,
                $upcomingTasks,
                $stats
            ));

            // Send deadline notifications for urgent tasks
            foreach ($overdueTasks as $task) {
                $user->notify(new TaskDeadlineNotification($task, 'overdue'));
            }

            foreach ($dueTodayTasks as $task) {
                $user->notify(new TaskDeadlineNotification($task, 'urgent'));
            }

            $sentCount++;
        }

        return response()->json([
            'message' => 'Notificacoes diarias enviadas',
            'count' => $sentCount,
        ]);
    }

    /**
     * Send weekly notifications
     */
    public function sendWeeklyNotifications(Request $request): JsonResponse
    {
        $users = User::where('weekly_notifications', true)
            ->where('is_active', true)
            ->get();

        $sentCount = 0;
        $weekStart = now()->startOfWeek();
        $weekEnd = now()->endOfWeek();
        $nextWeekEnd = now()->addWeek()->endOfWeek();

        foreach ($users as $user) {
            $groupIds = $user->accessibleGroupIds();

            if (empty($groupIds)) {
                continue;
            }

            // Calculate week statistics
            $weekStats = [
                'completed' => Task::whereIn('group_id', $groupIds)
                    ->where('responsible', $user->id)
                    ->whereIn('status', ['finished', 'rectified'])
                    ->whereBetween('updated_at', [$weekStart, $weekEnd])
                    ->count(),
                'created' => Task::whereIn('group_id', $groupIds)
                    ->where('responsible', $user->id)
                    ->whereBetween('created_at', [$weekStart, $weekEnd])
                    ->count(),
                'documents_approved' => DB::table('task_files')
                    ->join('tasks', 'task_files.task_id', '=', 'tasks.id')
                    ->whereIn('tasks.group_id', $groupIds)
                    ->where('tasks.responsible', $user->id)
                    ->where('task_files.approved', true)
                    ->whereBetween('task_files.updated_at', [$weekStart, $weekEnd])
                    ->count(),
            ];

            // Get next week tasks
            $nextWeekTasks = Task::whereIn('group_id', $groupIds)
                ->where('responsible', $user->id)
                ->where('deleted', false)
                ->where('is_active', true)
                ->whereNotIn('status', ['finished', 'rectified'])
                ->whereBetween('deadline', [$weekEnd, $nextWeekEnd])
                ->orderBy('deadline')
                ->get();

            // Get overdue tasks
            $overdueTasks = Task::whereIn('group_id', $groupIds)
                ->where('responsible', $user->id)
                ->where('deleted', false)
                ->where('is_active', true)
                ->where('status', 'late')
                ->orderBy('deadline')
                ->get();

            $user->notify(new WeeklySummaryNotification(
                $weekStats,
                $nextWeekTasks,
                $overdueTasks
            ));

            $sentCount++;
        }

        return response()->json([
            'message' => 'Notificacoes semanais enviadas',
            'count' => $sentCount,
        ]);
    }

    /**
     * Send monthly notifications
     */
    public function sendMonthlyNotifications(Request $request): JsonResponse
    {
        $users = User::where('monthly_notifications', true)
            ->where('is_active', true)
            ->get();

        $sentCount = 0;
        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();

        foreach ($users as $user) {
            $groupIds = $user->accessibleGroupIds();

            if (empty($groupIds)) {
                continue;
            }

            // Calculate month statistics
            $monthStats = [
                'completed' => Task::whereIn('group_id', $groupIds)
                    ->where('responsible', $user->id)
                    ->whereIn('status', ['finished', 'rectified'])
                    ->whereBetween('updated_at', [$monthStart, $monthEnd])
                    ->count(),
                'created' => Task::whereIn('group_id', $groupIds)
                    ->where('responsible', $user->id)
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count(),
                'overdue' => Task::whereIn('group_id', $groupIds)
                    ->where('responsible', $user->id)
                    ->where('status', 'late')
                    ->where('deleted', false)
                    ->count(),
            ];

            // Get next month tasks
            $nextMonthStart = now()->addMonth()->startOfMonth();
            $nextMonthEnd = now()->addMonth()->endOfMonth();

            $nextMonthTasks = Task::whereIn('group_id', $groupIds)
                ->where('responsible', $user->id)
                ->where('deleted', false)
                ->where('is_active', true)
                ->whereNotIn('status', ['finished', 'rectified'])
                ->whereBetween('deadline', [$nextMonthStart, $nextMonthEnd])
                ->orderBy('deadline')
                ->get();

            // Get overdue tasks
            $overdueTasks = Task::whereIn('group_id', $groupIds)
                ->where('responsible', $user->id)
                ->where('deleted', false)
                ->where('is_active', true)
                ->where('status', 'late')
                ->orderBy('deadline')
                ->get();

            // Reuse weekly notification for monthly (similar format)
            $user->notify(new WeeklySummaryNotification(
                $monthStats,
                $nextMonthTasks,
                $overdueTasks
            ));

            $sentCount++;
        }

        return response()->json([
            'message' => 'Notificacoes mensais enviadas',
            'count' => $sentCount,
        ]);
    }
}
