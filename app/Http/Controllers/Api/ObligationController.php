<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Application\Services\TaskGenerationService;
use App\Infrastructure\Persistence\Models\Obligation;
use App\Infrastructure\Persistence\Models\DocumentType;
use App\Infrastructure\Persistence\Models\ObligationCompanyUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ObligationController extends Controller
{
    public function __construct(
        private TaskGenerationService $taskGenerationService
    ) {}

    /**
     * List all obligations for accessible groups
     */
    public function index(Request $request): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $query = Obligation::with(['group', 'documentTypes'])
            ->whereIn('group_id', $groupIds)
            ->where('deleted', false);

        if ($request->filled('frequency')) {
            $query->where('frequency', $request->frequency);
        }

        if ($request->filled('kind')) {
            $query->where('kind', $request->kind);
        }

        if ($request->boolean('automatic_only')) {
            $query->where('generate_automatic_tasks', true);
        }

        $obligations = $query->orderBy('title')->paginate(20);

        return response()->json([
            'obligations' => $obligations->items(),
            'meta' => [
                'total' => $obligations->total(),
                'per_page' => $obligations->perPage(),
                'current_page' => $obligations->currentPage(),
                'last_page' => $obligations->lastPage(),
            ],
        ]);
    }

    /**
     * Get a single obligation with all relations
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $obligation = Obligation::with([
            'group',
            'documentTypes.approvers.user',
            'obligationCompanyUsers.company',
            'obligationCompanyUsers.user',
        ])
            ->whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        return response()->json([
            'obligation' => $obligation,
        ]);
    }

    /**
     * Create a new obligation
     */
    public function store(Request $request): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        if (empty($groupIds)) {
            return response()->json(['message' => 'Sem permissao para criar obrigacoes'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:30',
            'description' => 'nullable|string|max:250',
            'frequency' => 'required|in:MM,QT,AA',
            'day_deadline' => 'required|integer|min:1|max:31',
            'month_deadline' => 'nullable|integer|min:1|max:12',
            'group_id' => 'required|integer|in:' . implode(',', $groupIds),
            'kind' => 'required|string|max:30',
            'initial_generation_date' => 'required|date',
            'final_generation_date' => 'nullable|date|after:initial_generation_date',
            'period' => 'nullable|integer|min:1',
            'generate_automatic_tasks' => 'nullable|boolean',
            'show_dashboard' => 'nullable|boolean',
            'months_advanced' => 'nullable|integer|min:0',
        ]);

        $obligation = Obligation::create($request->only([
            'title',
            'description',
            'frequency',
            'day_deadline',
            'month_deadline',
            'group_id',
            'kind',
            'initial_generation_date',
            'final_generation_date',
            'period',
            'generate_automatic_tasks',
            'show_dashboard',
            'months_advanced',
        ]));

        return response()->json([
            'obligation' => $obligation->load(['group', 'documentTypes']),
            'message' => 'Obrigacao criada com sucesso!',
        ], 201);
    }

    /**
     * Update an obligation
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        $obligation = Obligation::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $request->validate([
            'title' => 'sometimes|string|max:30',
            'description' => 'nullable|string|max:250',
            'frequency' => 'sometimes|in:MM,QT,AA',
            'day_deadline' => 'sometimes|integer|min:1|max:31',
            'month_deadline' => 'nullable|integer|min:1|max:12',
            'kind' => 'sometimes|string|max:30',
            'final_generation_date' => 'nullable|date',
            'period' => 'nullable|integer|min:1',
            'generate_automatic_tasks' => 'nullable|boolean',
            'show_dashboard' => 'nullable|boolean',
            'months_advanced' => 'nullable|integer|min:0',
        ]);

        // If changing document structure, increment version
        $incrementVersion = $request->boolean('increment_version', false);
        if ($incrementVersion) {
            $obligation->incrementVersion();
        }

        $obligation->update($request->only([
            'title',
            'description',
            'frequency',
            'day_deadline',
            'month_deadline',
            'kind',
            'final_generation_date',
            'period',
            'generate_automatic_tasks',
            'show_dashboard',
            'months_advanced',
        ]));

        return response()->json([
            'obligation' => $obligation->fresh()->load(['group', 'documentTypes']),
            'message' => 'Obrigacao atualizada com sucesso!',
        ]);
    }

    /**
     * Delete (soft) an obligation
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        $obligation = Obligation::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $obligation->update(['deleted' => true]);

        return response()->json([
            'message' => 'Obrigacao excluida com sucesso!',
        ]);
    }

    /**
     * Generate tasks for an obligation
     */
    public function generateTasks(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        $obligation = Obligation::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $request->validate([
            'company_ids' => 'required|array|min:1',
            'company_ids.*' => 'integer|exists:companies,id',
            'competencies' => 'required|array|min:1',
            'competencies.*' => 'date',
            'responsible_user_id' => 'nullable|integer|exists:users,id',
        ]);

        $tasks = $this->taskGenerationService->generateTasks(
            $obligation,
            $request->company_ids,
            $request->competencies,
            $request->responsible_user_id
        );

        return response()->json([
            'tasks' => $tasks->load(['company', 'responsibleUser', 'documents']),
            'count' => $tasks->count(),
            'message' => "{$tasks->count()} tarefa(s) criada(s) com sucesso!",
        ]);
    }

    /**
     * Preview tasks that would be generated
     */
    public function previewTasks(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $obligation = Obligation::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $request->validate([
            'company_ids' => 'required|array|min:1',
            'company_ids.*' => 'integer|exists:companies,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $competencies = $this->taskGenerationService->generateCompetencies(
            $obligation,
            Carbon::parse($request->start_date),
            Carbon::parse($request->end_date)
        );

        $preview = $this->taskGenerationService->previewTasks(
            $obligation,
            $request->company_ids,
            $competencies
        );

        return response()->json([
            'preview' => $preview,
            'competencies' => $competencies,
            'total_new' => $preview->where('already_exists', false)->count(),
            'total_existing' => $preview->where('already_exists', true)->count(),
        ]);
    }

    /**
     * Update dynamic fields for an obligation
     */
    public function updateDynamicFields(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        $obligation = Obligation::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $request->validate([
            'dynamic_fields' => 'required|array',
        ]);

        $obligation->update([
            'dynamic_fields' => $request->dynamic_fields,
        ]);

        return response()->json([
            'obligation' => $obligation->fresh(),
            'message' => 'Campos dinamicos atualizados com sucesso!',
        ]);
    }

    /**
     * Delete a dynamic field
     */
    public function deleteDynamicField(Request $request, int $id, string $field): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        $obligation = Obligation::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $dynamicFields = $obligation->dynamic_fields ?? [];
        unset($dynamicFields[$field]);

        $obligation->update(['dynamic_fields' => $dynamicFields]);

        return response()->json([
            'obligation' => $obligation->fresh(),
            'message' => 'Campo dinamico removido com sucesso!',
        ]);
    }

    /**
     * Update flowchart configuration
     */
    public function updateFlowchart(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        $obligation = Obligation::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $request->validate([
            'flowchart_fields' => 'required|array',
        ]);

        $obligation->update([
            'flowchart_fields' => $request->flowchart_fields,
        ]);

        return response()->json([
            'obligation' => $obligation->fresh(),
            'message' => 'Fluxograma atualizado com sucesso!',
        ]);
    }
}
