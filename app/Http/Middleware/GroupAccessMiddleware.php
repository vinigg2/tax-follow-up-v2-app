<?php

namespace App\Http\Middleware;

use App\Infrastructure\Persistence\Models\Group;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GroupAccessMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Validates that the user has access to the specified group.
     * Optionally checks for admin/owner permissions.
     */
    public function handle(Request $request, Closure $next, ?string $permission = null): Response
    {
        $user = $request->user();

        // Get group from route parameter
        $groupId = $request->route('group') ?? $request->input('group_id');

        if (!$groupId) {
            return $next($request);
        }

        // If group is a model instance, get the ID
        if ($groupId instanceof Group) {
            $groupId = $groupId->id;
        }

        $accessibleGroupIds = $request->input('accessible_group_ids', $user->accessibleGroupIds());

        // Check basic access
        if (!in_array($groupId, $accessibleGroupIds)) {
            return response()->json([
                'message' => 'You do not have access to this group.',
                'error' => 'forbidden',
            ], 403);
        }

        // Check permission level if specified
        if ($permission) {
            $hasPermission = match ($permission) {
                'admin' => in_array($groupId, $user->adminGroupIds()) || in_array($groupId, $user->ownerGroupIds()),
                'owner' => in_array($groupId, $user->ownerGroupIds()),
                default => true,
            };

            if (!$hasPermission) {
                return response()->json([
                    'message' => "You need {$permission} permission for this action.",
                    'error' => 'insufficient_permissions',
                ], 403);
            }
        }

        return $next($request);
    }
}
