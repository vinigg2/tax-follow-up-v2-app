<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\Company;
use App\Infrastructure\Persistence\Models\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard overview statistics
     */
    public function overview(Request $request): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $stats = [
            'total_tasks' => $this->getTotalTasks($groupIds),
            'by_status' => $this->getTasksByStatus($groupIds),
            'delayed_tasks' => $this->getDelayedTasksCount($groupIds),
            'completed_this_month' => $this->getCompletedThisMonth($groupIds),
            'upcoming_deadlines' => $this->getUpcomingDeadlines($groupIds),
        ];

        return response()->json([
            'stats' => $stats,
        ]);
    }

    /**
     * Get tasks grouped by teams (groups)
     */
    public function teams(Request $request): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $teams = Group::whereIn('id', $groupIds)
            ->where('deleted', false)
            ->withCount([
                'tasks as total_tasks' => function ($query) {
                    $query->where('deleted', false)
                        ->where('is_active', true)
                        ->whereNotIn('status', ['finished', 'rectified']);
                },
                'tasks as delayed_tasks' => function ($query) {
                    $query->where('deleted', false)
                        ->where('is_active', true)
                        ->where('status', 'late');
                },
                'tasks as pending_tasks' => function ($query) {
                    $query->where('deleted', false)
                        ->where('is_active', true)
                        ->where('status', 'pending');
                },
            ])
            ->get()
            ->map(function ($team) {
                return [
                    'id' => $team->id,
                    'name' => $team->name,
                    'total_tasks' => $team->total_tasks,
                    'delayed_tasks' => $team->delayed_tasks,
                    'pending_tasks' => $team->pending_tasks,
                    'health_score' => $this->calculateHealthScore($team),
                ];
            });

        return response()->json([
            'teams' => $teams,
        ]);
    }

    /**
     * Get detailed status for a specific team
     */
    public function teamStatus(Request $request, int $groupId): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        if (!in_array($groupId, $groupIds)) {
            return response()->json(['message' => 'Acesso nao autorizado'], 403);
        }

        $tasks = Task::where('group_id', $groupId)
            ->where('deleted', false)
            ->where('is_active', true)
            ->whereNotIn('status', ['finished', 'rectified'])
            ->get();

        $byStatus = $tasks->groupBy('status')->map->count();
        $byCompany = $tasks->groupBy('company_id')->map(function ($companyTasks, $companyId) {
            $company = Company::find($companyId);
            return [
                'company_id' => $companyId,
                'company_name' => $company?->name ?? 'Desconhecida',
                'total' => $companyTasks->count(),
                'by_status' => $companyTasks->groupBy('status')->map->count(),
            ];
        })->values();

        $recentActivity = Task::where('group_id', $groupId)
            ->where('deleted', false)
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->with(['company', 'responsibleUser'])
            ->get();

        return response()->json([
            'group_id' => $groupId,
            'summary' => [
                'total' => $tasks->count(),
                'by_status' => $byStatus,
            ],
            'by_company' => $byCompany,
            'recent_activity' => $recentActivity,
        ]);
    }

    /**
     * Get detailed status for a specific company
     */
    public function companyStatus(Request $request, int $companyId): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $company = Company::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($companyId);

        $tasks = Task::where('company_id', $companyId)
            ->where('deleted', false)
            ->where('is_active', true)
            ->whereNotIn('status', ['finished', 'rectified'])
            ->with(['obligation', 'responsibleUser'])
            ->get();

        $byStatus = $tasks->groupBy('status')->map->count();
        $byObligation = $tasks->groupBy('cause_id')->map(function ($obligationTasks, $causeId) {
            $obligation = $obligationTasks->first()->obligation;
            return [
                'obligation_id' => $causeId,
                'obligation_title' => $obligation?->title ?? 'Desconhecida',
                'total' => $obligationTasks->count(),
                'by_status' => $obligationTasks->groupBy('status')->map->count(),
            ];
        })->values();

        $upcomingDeadlines = $tasks->sortBy('deadline')->take(5)->map(function ($task) {
            return [
                'id' => $task->id,
                'title' => $task->title,
                'deadline' => $task->deadline->format('Y-m-d'),
                'days_until' => now()->diffInDays($task->deadline, false),
                'status' => $task->status,
                'responsible' => $task->responsibleUser?->name,
            ];
        })->values();

        return response()->json([
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'cnpj' => $company->cnpj,
            ],
            'summary' => [
                'total' => $tasks->count(),
                'by_status' => $byStatus,
            ],
            'by_obligation' => $byObligation,
            'upcoming_deadlines' => $upcomingDeadlines,
        ]);
    }

    /**
     * Get companies with task stats
     */
    public function companies(Request $request): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $companies = Company::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->withCount([
                'tasks as total_tasks' => function ($query) {
                    $query->where('deleted', false)
                        ->where('is_active', true)
                        ->whereNotIn('status', ['finished', 'rectified']);
                },
                'tasks as delayed_tasks' => function ($query) {
                    $query->where('deleted', false)
                        ->where('is_active', true)
                        ->where('status', 'late');
                },
                'tasks as pending_tasks' => function ($query) {
                    $query->where('deleted', false)
                        ->where('is_active', true)
                        ->where('status', 'pending');
                },
                'tasks as finished_tasks' => function ($query) {
                    $query->where('deleted', false)
                        ->whereIn('status', ['finished', 'rectified']);
                },
            ])
            ->orderByDesc('total_tasks')
            ->get()
            ->map(function ($company) {
                return [
                    'id' => $company->id,
                    'name' => $company->name,
                    'cnpj' => $company->cnpj,
                    'total_tasks' => $company->total_tasks,
                    'delayed_tasks' => $company->delayed_tasks,
                    'pending_tasks' => $company->pending_tasks,
                    'finished_tasks' => $company->finished_tasks,
                    'health_score' => $this->calculateCompanyHealthScore($company),
                ];
            });

        return response()->json([
            'companies' => $companies,
        ]);
    }

    /**
     * Get tasks calendar data
     */
    public function calendar(Request $request): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);
        $startDate = $request->input('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', now()->endOfMonth()->format('Y-m-d'));

        $tasks = Task::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', true)
            ->whereBetween('deadline', [$startDate, $endDate])
            ->with(['company', 'responsibleUser'])
            ->get()
            ->groupBy(function ($task) {
                return $task->deadline->format('Y-m-d');
            })
            ->map(function ($dayTasks, $date) {
                return [
                    'date' => $date,
                    'total' => $dayTasks->count(),
                    'delayed' => $dayTasks->where('status', 'late')->count(),
                    'pending' => $dayTasks->where('status', 'pending')->count(),
                    'tasks' => $dayTasks->map(function ($task) {
                        return [
                            'id' => $task->id,
                            'title' => $task->title,
                            'company' => $task->company->name,
                            'status' => $task->status,
                            'responsible' => $task->responsibleUser?->name,
                        ];
                    }),
                ];
            });

        return response()->json([
            'calendar' => $tasks->values(),
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);
    }

    /**
     * Get performance metrics
     */
    public function performance(Request $request): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);
        $period = $request->input('period', 30); // days

        $startDate = now()->subDays($period);

        // Completed on time vs late
        $completedTasks = Task::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->whereIn('status', ['finished', 'rectified'])
            ->where('conclusion_date', '>=', $startDate)
            ->get();

        $onTime = $completedTasks->filter(function ($task) {
            return $task->conclusion_date <= $task->deadline;
        })->count();

        $late = $completedTasks->count() - $onTime;

        // Average completion time
        $avgCompletionDays = $completedTasks->avg(function ($task) {
            return $task->created_at->diffInDays($task->conclusion_date);
        }) ?? 0;

        // Productivity by user
        $byUser = $completedTasks->groupBy('responsible')->map(function ($userTasks, $userId) {
            return [
                'user_id' => $userId,
                'user_name' => $userTasks->first()->responsibleUser?->name ?? 'Sem responsavel',
                'completed' => $userTasks->count(),
            ];
        })->values();

        return response()->json([
            'period_days' => $period,
            'completed_total' => $completedTasks->count(),
            'completed_on_time' => $onTime,
            'completed_late' => $late,
            'on_time_percentage' => $completedTasks->count() > 0
                ? round(($onTime / $completedTasks->count()) * 100, 1)
                : 0,
            'avg_completion_days' => round($avgCompletionDays, 1),
            'by_user' => $byUser,
        ]);
    }

    // ==================== Private Methods ====================

    private function getTotalTasks(array $groupIds): int
    {
        return Task::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', true)
            ->whereNotIn('status', ['finished', 'rectified'])
            ->count();
    }

    private function getTasksByStatus(array $groupIds): array
    {
        return Task::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', true)
            ->whereNotIn('status', ['finished', 'rectified'])
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();
    }

    private function getDelayedTasksCount(array $groupIds): int
    {
        return Task::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', true)
            ->where('status', 'late')
            ->count();
    }

    private function getCompletedThisMonth(array $groupIds): int
    {
        return Task::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->whereIn('status', ['finished', 'rectified'])
            ->whereMonth('conclusion_date', now()->month)
            ->whereYear('conclusion_date', now()->year)
            ->count();
    }

    private function getUpcomingDeadlines(array $groupIds, int $days = 7): array
    {
        return Task::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->where('is_active', true)
            ->whereNotIn('status', ['finished', 'rectified'])
            ->whereBetween('deadline', [now(), now()->addDays($days)])
            ->with(['company', 'responsibleUser'])
            ->orderBy('deadline')
            ->limit(10)
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'company' => $task->company->name,
                    'deadline' => $task->deadline->format('Y-m-d'),
                    'days_until' => now()->diffInDays($task->deadline, false),
                    'status' => $task->status,
                    'responsible' => $task->responsibleUser?->name,
                ];
            })
            ->toArray();
    }

    private function calculateHealthScore($team): int
    {
        if ($team->total_tasks === 0) {
            return 100;
        }

        $delayedRatio = $team->delayed_tasks / $team->total_tasks;
        $pendingRatio = $team->pending_tasks / $team->total_tasks;

        // Health score: 100 - (delayed * 50 + pending * 10)
        $score = 100 - ($delayedRatio * 50) - ($pendingRatio * 10);

        return max(0, min(100, round($score)));
    }

    private function calculateCompanyHealthScore($company): int
    {
        if ($company->total_tasks === 0) {
            return 100;
        }

        $delayedRatio = $company->delayed_tasks / $company->total_tasks;
        $pendingRatio = $company->pending_tasks / $company->total_tasks;

        // Health score: 100 - (delayed * 50 + pending * 10)
        $score = 100 - ($delayedRatio * 50) - ($pendingRatio * 10);

        return max(0, min(100, round($score)));
    }
}
