<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        // Get users that belong to any of the accessible groups
        $users = User::whereHas('groups', function ($query) use ($groupIds) {
            $query->whereIn('groups.id', $groupIds);
        })->select('id', 'name', 'email', 'avatar')->get();

        return response()->json(['users' => $users]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        $user = User::whereHas('groups', function ($query) use ($groupIds) {
            $query->whereIn('groups.id', $groupIds);
        })->findOrFail($id);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'language' => $user->language,
            ],
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        // Users can only update their own profile
        if ($user->id !== $id) {
            return response()->json(['message' => 'Sem permissao'], 403);
        }

        $request->validate([
            'name' => 'sometimes|string|min:2|max:50',
            'language' => 'sometimes|in:pt,en',
        ]);

        $user->update($request->only(['name', 'language']));

        return response()->json([
            'user' => $user->fresh(),
            'message' => 'Perfil atualizado com sucesso!',
        ]);
    }

    public function updateNotifications(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if ($user->id !== $id) {
            return response()->json(['message' => 'Sem permissao'], 403);
        }

        $request->validate([
            'daily_notifications' => 'sometimes|boolean',
            'weekly_notifications' => 'sometimes|boolean',
            'monthly_notifications' => 'sometimes|boolean',
        ]);

        $user->update($request->only([
            'daily_notifications',
            'weekly_notifications',
            'monthly_notifications',
        ]));

        return response()->json([
            'user' => $user->fresh(),
            'message' => 'Preferencias de notificacao atualizadas!',
        ]);
    }

    public function uploadAvatar(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if ($user->id !== $id) {
            return response()->json(['message' => 'Sem permissao'], 403);
        }

        $request->validate([
            'avatar' => 'required|image|max:2048',
        ]);

        $path = $request->file('avatar')->store('avatars', 'public');

        $user->update(['avatar' => $path]);

        return response()->json([
            'user' => $user->fresh(),
            'message' => 'Avatar atualizado com sucesso!',
        ]);
    }
}
