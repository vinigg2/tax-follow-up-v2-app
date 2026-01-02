<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Models\User;
use App\Mail\WelcomeMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $groupIds = $request->input('accessible_group_ids', []);

        // Get users that belong to any of the accessible groups
        $query = User::whereHas('groups', function ($query) use ($groupIds) {
            $query->whereIn('groups.id', $groupIds);
        });

        // Filter by status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->select('id', 'name', 'email', 'avatar', 'is_active')->get();

        return response()->json(['users' => $users]);
    }

    /**
     * Create a new user
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|min:2|max:50',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:6',
            'language' => 'sometimes|in:pt,en',
            'group_id' => 'required|exists:groups,id',
            'is_admin' => 'sometimes|boolean',
        ]);

        // Check if user has permission to add users to this group
        $adminGroupIds = $request->input('admin_group_ids', []);
        if (!in_array($request->group_id, $adminGroupIds)) {
            return response()->json([
                'message' => 'Voce nao tem permissao para adicionar usuarios a este grupo.',
            ], 403);
        }

        // Generate random password if not provided
        $password = $request->password ?? Str::random(12);

        $user = User::create([
            'name' => $request->name,
            'email' => strtolower($request->email),
            'username' => strtolower(Str::slug($request->name, '_') . '_' . Str::random(4)),
            'password' => Hash::make($password),
            'language' => $request->language ?? 'pt',
            'is_active' => true,
        ]);

        // Add user to the group
        $user->groups()->attach($request->group_id, [
            'is_admin' => $request->boolean('is_admin', false),
        ]);

        // Send welcome email with password
        try {
            Mail::to($user->email)->send(new WelcomeMail($user->name));
        } catch (\Exception $e) {
            \Log::error('Failed to send welcome email: ' . $e->getMessage());
        }

        return response()->json([
            'user' => $user,
            'temporary_password' => $password,
            'message' => 'Usuario criado com sucesso.',
        ], 201);
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

    /**
     * Delete/deactivate a user
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        $adminGroupIds = $request->input('admin_group_ids', []);

        // Find the user
        $user = User::findOrFail($id);

        // Cannot delete yourself
        if ($currentUser->id === $id) {
            return response()->json([
                'message' => 'Voce nao pode remover sua propria conta.',
            ], 400);
        }

        // Check if current user has admin access to any group the target user belongs to
        $userGroupIds = $user->groups()->pluck('groups.id')->toArray();
        $hasPermission = !empty(array_intersect($adminGroupIds, $userGroupIds));

        if (!$hasPermission) {
            return response()->json([
                'message' => 'Voce nao tem permissao para remover este usuario.',
            ], 403);
        }

        // Soft delete - just deactivate
        $user->update(['is_active' => false]);

        return response()->json([
            'message' => 'Usuario desativado com sucesso.',
        ]);
    }

    /**
     * Toggle user active status
     */
    public function toggleActive(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        $adminGroupIds = $request->input('admin_group_ids', []);

        // Find the user
        $user = User::findOrFail($id);

        // Cannot toggle yourself
        if ($currentUser->id === $id) {
            return response()->json([
                'message' => 'Voce nao pode alterar seu proprio status.',
            ], 400);
        }

        // Check if current user has admin access
        $userGroupIds = $user->groups()->pluck('groups.id')->toArray();
        $hasPermission = !empty(array_intersect($adminGroupIds, $userGroupIds));

        if (!$hasPermission) {
            return response()->json([
                'message' => 'Voce nao tem permissao para alterar este usuario.',
            ], 403);
        }

        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'user' => $user->fresh(),
            'message' => $user->is_active ? 'Usuario ativado.' : 'Usuario desativado.',
        ]);
    }

    /**
     * Update user password (admin action)
     */
    public function updatePassword(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        $adminGroupIds = $request->input('admin_group_ids', []);

        $request->validate([
            'password' => 'required|string|min:6|confirmed',
        ]);

        // Find the user
        $user = User::findOrFail($id);

        // Check permission - user can update own password or admin can update others
        if ($currentUser->id !== $id) {
            $userGroupIds = $user->groups()->pluck('groups.id')->toArray();
            $hasPermission = !empty(array_intersect($adminGroupIds, $userGroupIds));

            if (!$hasPermission) {
                return response()->json([
                    'message' => 'Voce nao tem permissao para alterar a senha deste usuario.',
                ], 403);
            }
        }

        $user->update([
            'password' => Hash::make($request->password),
            'last_change_password' => now(),
        ]);

        return response()->json([
            'message' => 'Senha alterada com sucesso.',
        ]);
    }
}
