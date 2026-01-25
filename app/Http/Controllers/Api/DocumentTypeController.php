<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Models\DocumentType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentTypeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $documentTypes = DocumentType::with(['obligation', 'approvers.user'])
            ->whereHas('obligation', fn($q) => $q->whereIn('group_id', $groupIds))
            ->paginate(20);

        return response()->json([
            'document_types' => $documentTypes->items(),
            'meta' => [
                'total' => $documentTypes->total(),
                'per_page' => $documentTypes->perPage(),
                'current_page' => $documentTypes->currentPage(),
                'last_page' => $documentTypes->lastPage(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $documentType = DocumentType::with(['obligation', 'approvers.user'])
            ->whereHas('obligation', fn($q) => $q->whereIn('group_id', $groupIds))
            ->findOrFail($id);

        return response()->json(['document_type' => $documentType]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:30',
            'description' => 'nullable|string|max:250',
            'obligation_id' => 'required|exists:obligations,id',
            'is_obligatory' => 'nullable|boolean',
            'estimated_days' => 'nullable|integer|min:1',
            'required_file' => 'nullable|boolean',
            'approval_required' => 'nullable|in:N,S,P',
            'order_items' => 'nullable|integer',
        ]);

        $documentType = DocumentType::create($request->all());

        return response()->json([
            'document_type' => $documentType,
            'message' => 'Tipo de documento criado com sucesso!',
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('content_manager_group_ids', []);

        $documentType = DocumentType::whereHas('obligation', fn($q) => $q->whereIn('group_id', $groupIds))
            ->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:30',
            'description' => 'nullable|string|max:250',
            'is_obligatory' => 'nullable|boolean',
            'estimated_days' => 'nullable|integer|min:1',
            'required_file' => 'nullable|boolean',
            'approval_required' => 'nullable|in:N,S,P',
            'order_items' => 'nullable|integer',
        ]);

        $documentType->update($request->all());

        return response()->json([
            'document_type' => $documentType->fresh(),
            'message' => 'Tipo de documento atualizado com sucesso!',
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('content_manager_group_ids', []);

        $documentType = DocumentType::whereHas('obligation', fn($q) => $q->whereIn('group_id', $groupIds))
            ->findOrFail($id);

        $documentType->delete();

        return response()->json(['message' => 'Tipo de documento excluido com sucesso!']);
    }
}
