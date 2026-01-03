<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'unread_count' => $user->unreadNotifications()->count(),
            ],
        ]);
    }

    /**
     * Get unread notifications count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $request->user()->unreadNotifications()->count();

        return response()->json([
            'count' => $count,
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notificacao nao encontrada'], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notificacao marcada como lida',
            'notification' => $notification,
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'message' => 'Todas as notificacoes marcadas como lidas',
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notificacao nao encontrada'], 404);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Notificacao excluida',
        ]);
    }

    /**
     * Delete all read notifications
     */
    public function destroyRead(Request $request): JsonResponse
    {
        $deleted = $request->user()
            ->notifications()
            ->whereNotNull('read_at')
            ->delete();

        return response()->json([
            'message' => 'Notificacoes lidas excluidas',
            'count' => $deleted,
        ]);
    }

    /**
     * Update notification preferences
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'daily_notifications' => 'sometimes|boolean',
            'weekly_notifications' => 'sometimes|boolean',
            'monthly_notifications' => 'sometimes|boolean',
        ]);

        $request->user()->update($validated);

        return response()->json([
            'message' => 'Preferencias atualizadas',
            'preferences' => [
                'daily_notifications' => $request->user()->daily_notifications,
                'weekly_notifications' => $request->user()->weekly_notifications,
                'monthly_notifications' => $request->user()->monthly_notifications,
            ],
        ]);
    }

    /**
     * Get notification preferences
     */
    public function getPreferences(Request $request): JsonResponse
    {
        return response()->json([
            'daily_notifications' => $request->user()->daily_notifications,
            'weekly_notifications' => $request->user()->weekly_notifications,
            'monthly_notifications' => $request->user()->monthly_notifications,
        ]);
    }
}
