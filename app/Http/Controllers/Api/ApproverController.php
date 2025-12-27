<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Models\Approver;
use App\Infrastructure\Persistence\Models\DocumentType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApproverController extends Controller
{
    public function store(Request $request, int $documentTypeId): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'sequence' => 'required|integer|min:1',
        ]);

        $approver = Approver::create([
            'document_type_id' => $documentTypeId,
            'user_id' => $request->user_id,
            'sequence' => $request->sequence,
        ]);

        return response()->json([
            'approver' => $approver->load('user'),
            'message' => 'Aprovador adicionado com sucesso!',
        ], 201);
    }

    public function update(Request $request, int $documentTypeId, int $id): JsonResponse
    {
        $approver = Approver::where('document_type_id', $documentTypeId)->findOrFail($id);

        $request->validate([
            'sequence' => 'sometimes|integer|min:1',
        ]);

        $approver->update($request->only('sequence'));

        return response()->json([
            'approver' => $approver->fresh()->load('user'),
            'message' => 'Aprovador atualizado com sucesso!',
        ]);
    }

    public function destroy(Request $request, int $documentTypeId, int $id): JsonResponse
    {
        $approver = Approver::where('document_type_id', $documentTypeId)->findOrFail($id);
        $approver->delete();

        return response()->json(['message' => 'Aprovador removido com sucesso!']);
    }

    public function reorder(Request $request, int $documentTypeId): JsonResponse
    {
        $request->validate([
            'approvers' => 'required|array',
            'approvers.*.id' => 'required|exists:approvers,id',
            'approvers.*.sequence' => 'required|integer|min:1',
        ]);

        foreach ($request->approvers as $approverData) {
            Approver::where('id', $approverData['id'])
                ->where('document_type_id', $documentTypeId)
                ->update(['sequence' => $approverData['sequence']]);
        }

        return response()->json(['message' => 'Ordem dos aprovadores atualizada com sucesso!']);
    }
}
