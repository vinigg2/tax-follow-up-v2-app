<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Ensures the user has access to at least one group (tenant).
     * Stores accessible group IDs in the request for later use.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $accessibleGroupIds = $user->accessibleGroupIds();

        if (empty($accessibleGroupIds)) {
            return response()->json([
                'message' => 'No accessible groups found. Please join a group first.',
                'error' => 'no_groups',
            ], 403);
        }

        // Store accessible groups in request for use in controllers
        $adminGroupIds = $user->adminGroupIds();
        $managerGroupIds = $user->managerGroupIds();

        $request->merge([
            'accessible_group_ids' => $accessibleGroupIds,
            'admin_group_ids' => $adminGroupIds,
            'manager_group_ids' => $managerGroupIds,
            'owner_group_ids' => $user->ownerGroupIds(),
            // Groups where user can manage content (admin or manager)
            'content_manager_group_ids' => array_unique(array_merge($adminGroupIds, $managerGroupIds)),
        ]);

        return $next($request);
    }
}
