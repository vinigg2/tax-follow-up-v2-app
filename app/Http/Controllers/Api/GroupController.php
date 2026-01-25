<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Models\Company;
use App\Infrastructure\Persistence\Models\Group;
use App\Infrastructure\Persistence\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroupController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $groups = Group::whereIn('id', $groupIds)
            ->where('deleted', false)
            ->with('owner')
            ->withCount(['users', 'companies'])
            ->get()
            ->map(function ($group) {
                $group->members_count = $group->users_count;
                $group->companies_count = $group->companies_count;
                return $group;
            });

        // Return 'teams' key when called via /teams endpoint for frontend compatibility
        $key = str_contains($request->path(), 'teams') ? 'teams' : 'groups';

        return response()->json([$key => $groups]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $group = Group::whereIn('id', $groupIds)
            ->where('deleted', false)
            ->with(['owner', 'users'])
            ->findOrFail($id);

        // Return 'team' key when called via /teams endpoint for frontend compatibility
        $key = str_contains($request->path(), 'teams') ? 'team' : 'group';

        return response()->json([$key => $group]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $group = Group::create([
            'name' => $request->name,
            'owner_id' => $request->user()->id,
        ]);

        // Add creator as admin
        $group->users()->attach($request->user()->id, ['role' => 'admin']);

        // Return 'team' key when called via /teams endpoint for frontend compatibility
        $key = str_contains($request->path(), 'teams') ? 'team' : 'group';

        return response()->json([
            $key => $group->load(['owner', 'users']),
            'message' => 'Grupo criado com sucesso!',
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $ownerGroupIds = $request->input('owner_group_ids', []);

        $group = Group::whereIn('id', $ownerGroupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
        ]);

        $group->update($request->only('name'));

        // Return 'team' key when called via /teams endpoint for frontend compatibility
        $key = str_contains($request->path(), 'teams') ? 'team' : 'group';

        return response()->json([
            $key => $group->fresh()->load(['owner', 'users']),
            'message' => 'Grupo atualizado com sucesso!',
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $ownerGroupIds = $request->input('owner_group_ids', []);

        $group = Group::whereIn('id', $ownerGroupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $group->update(['deleted' => true]);

        return response()->json(['message' => 'Grupo excluido com sucesso!']);
    }

    public function users(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $group = Group::whereIn('id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $users = $group->users()->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'role' => $user->pivot->role,
            ];
        });

        // Return 'members' key when called via /teams/*/members endpoint for frontend compatibility
        $key = str_contains($request->path(), 'members') ? 'members' : 'users';

        return response()->json([$key => $users]);
    }

    public function removeUser(Request $request, int $id, int $userId): JsonResponse
    {
        $adminGroupIds = $request->input('admin_group_ids', []);

        $group = Group::whereIn('id', $adminGroupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        if ($group->owner_id === $userId) {
            return response()->json(['message' => 'Nao e possivel remover o proprietario do grupo'], 403);
        }

        $group->users()->detach($userId);

        return response()->json(['message' => 'Usuario removido do grupo com sucesso!']);
    }

    public function addMember(Request $request, int $id): JsonResponse
    {
        $adminGroupIds = $request->input('admin_group_ids', []);

        $group = Group::whereIn('id', $adminGroupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $userId = $request->user_id;

        // Check if user is already in the group
        if ($group->users()->where('users.id', $userId)->exists()) {
            return response()->json(['message' => 'Usuario ja e membro deste grupo.'], 400);
        }

        $group->users()->attach($userId, ['role' => 'member']);

        return response()->json(['message' => 'Membro adicionado com sucesso!']);
    }

    public function updateUserRole(Request $request, int $id, int $userId): JsonResponse
    {
        $adminGroupIds = $request->input('admin_group_ids', []);

        $group = Group::whereIn('id', $adminGroupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        if ($group->owner_id === $userId) {
            return response()->json(['message' => 'Nao e possivel alterar a funcao do proprietario'], 403);
        }

        $request->validate([
            'role' => 'required|string|in:admin,manager,member',
        ]);

        $group->users()->updateExistingPivot($userId, ['role' => $request->role]);

        return response()->json(['message' => 'Funcao do usuario atualizada com sucesso!']);
    }

    public function companies(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $group = Group::whereIn('id', $groupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $companies = $group->companies()
            ->where('deleted', false)
            ->select('id', 'name', 'cnpj', 'group_id')
            ->orderBy('name')
            ->get();

        return response()->json(['companies' => $companies]);
    }

    public function linkCompany(Request $request, int $id): JsonResponse
    {
        $adminGroupIds = $request->input('admin_group_ids', []);

        $group = Group::whereIn('id', $adminGroupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $request->validate([
            'company_id' => 'required|integer|exists:companies,id',
        ]);

        $company = Company::where('deleted', false)->findOrFail($request->company_id);

        // Check if company is already in this group
        if ($company->group_id === $id) {
            return response()->json(['message' => 'Empresa ja esta vinculada a este grupo.'], 400);
        }

        $company->update(['group_id' => $id]);

        return response()->json(['message' => 'Empresa vinculada com sucesso!']);
    }

    public function unlinkCompany(Request $request, int $id, int $companyId): JsonResponse
    {
        $adminGroupIds = $request->input('admin_group_ids', []);

        $group = Group::whereIn('id', $adminGroupIds)
            ->where('deleted', false)
            ->findOrFail($id);

        $company = Company::where('group_id', $id)
            ->where('deleted', false)
            ->findOrFail($companyId);

        // We can't really "unlink" a company since it needs to belong to a group
        // Instead, we'll return an error explaining this
        return response()->json([
            'message' => 'Empresas nao podem ser desvinculadas. Use a opcao de transferir para outro grupo ou excluir a empresa.',
        ], 400);
    }
}
