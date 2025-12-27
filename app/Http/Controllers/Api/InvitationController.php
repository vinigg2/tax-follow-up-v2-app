<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Models\Invitation;
use App\Infrastructure\Persistence\Models\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $adminGroupIds = $request->input('admin_group_ids', []);

        $invitations = Invitation::whereIn('group_id', $adminGroupIds)
            ->where('status', 'pending')
            ->with('group')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['invitations' => $invitations]);
    }

    public function store(Request $request, int $groupId): JsonResponse
    {
        $adminGroupIds = $request->input('admin_group_ids', []);

        if (!in_array($groupId, $adminGroupIds)) {
            return response()->json(['message' => 'Sem permissao para convidar para este grupo'], 403);
        }

        $request->validate([
            'email' => 'required|email',
            'is_admin' => 'nullable|boolean',
        ]);

        // Check if invitation already exists
        $existing = Invitation::where('email', $request->email)
            ->where('group_id', $groupId)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Ja existe um convite pendente para este email'], 422);
        }

        $invitation = Invitation::create([
            'email' => $request->email,
            'group_id' => $groupId,
            'invited_by' => $request->user()->id,
            'code' => Str::random(32),
            'is_admin' => $request->boolean('is_admin', false),
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        // TODO: Send invitation email

        return response()->json([
            'invitation' => $invitation->load('group'),
            'message' => 'Convite enviado com sucesso!',
        ], 201);
    }

    public function show(string $code): JsonResponse
    {
        $invitation = Invitation::where('code', $code)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->with('group')
            ->firstOrFail();

        return response()->json(['invitation' => $invitation]);
    }

    public function accept(Request $request, string $code): JsonResponse
    {
        $invitation = Invitation::where('code', $code)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->firstOrFail();

        $user = $request->user();

        // Check if user email matches invitation
        if ($user->email !== $invitation->email) {
            return response()->json([
                'message' => 'Este convite foi enviado para outro email',
            ], 403);
        }

        // Add user to group
        $invitation->group->users()->attach($user->id, [
            'is_admin' => $invitation->is_admin,
        ]);

        $invitation->update(['status' => 'accepted']);

        return response()->json([
            'group' => $invitation->group,
            'message' => 'Convite aceito com sucesso!',
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $adminGroupIds = $request->input('admin_group_ids', []);

        $invitation = Invitation::whereIn('group_id', $adminGroupIds)
            ->findOrFail($id);

        $invitation->delete();

        return response()->json(['message' => 'Convite cancelado com sucesso!']);
    }
}
