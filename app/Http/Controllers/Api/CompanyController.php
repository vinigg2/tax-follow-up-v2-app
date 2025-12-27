<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $companies = Company::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'companies' => $companies->items(),
            'meta' => [
                'total' => $companies->total(),
                'per_page' => $companies->perPage(),
                'current_page' => $companies->currentPage(),
                'last_page' => $companies->lastPage(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $company = Company::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        return response()->json(['company' => $company]);
    }

    public function store(Request $request): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        $request->validate([
            'name' => 'required|string|max:255',
            'cnpj' => 'required|string|max:20',
            'country' => 'required|string|size:2',
            'group_id' => 'required|integer|in:' . implode(',', $groupIds),
        ]);

        $company = Company::create($request->only(['name', 'cnpj', 'country', 'group_id']));

        return response()->json([
            'company' => $company,
            'message' => 'Empresa criada com sucesso!',
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        $company = Company::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'cnpj' => 'sometimes|string|max:20',
            'country' => 'sometimes|string|size:2',
        ]);

        $company->update($request->only(['name', 'cnpj', 'country']));

        return response()->json([
            'company' => $company->fresh(),
            'message' => 'Empresa atualizada com sucesso!',
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('admin_group_ids', []);

        $company = Company::whereIn('group_id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $company->update(['deleted' => true]);

        return response()->json(['message' => 'Empresa excluida com sucesso!']);
    }
}
