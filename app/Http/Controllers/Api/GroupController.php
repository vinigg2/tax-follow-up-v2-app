<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
            ->get();

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
        $group->users()->attach($request->user()->id, ['is_admin' => true]);

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
                'is_admin' => (bool) $user->pivot->is_admin,
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
            'is_admin' => 'required|boolean',
        ]);

        $group->users()->updateExistingPivot($userId, ['is_admin' => $request->is_admin]);

        return response()->json(['message' => 'Funcao do usuario atualizada com sucesso!']);
    }
}
