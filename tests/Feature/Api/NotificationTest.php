<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Infrastructure\Persistence\Models\User;
use Illuminate\Support\Str;

class NotificationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->createUserWithGroup();
    }

    // ==================== INDEX TESTS ====================

    public function test_can_list_notifications(): void
    {
        // Create notifications for user
        $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\TaskDeadlineNotification',
            'data' => [
                'title' => 'Task Deadline',
                'message' => 'Task is due soon',
                'task_id' => 1,
            ],
        ]);

        $this->actingAsUser();

        $response = $this->getJson('/api/notifications', $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'data',
                'meta',
            ]);
    }

    public function test_notifications_are_ordered_by_date(): void
    {
        $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\TaskDeadlineNotification',
            'data' => ['title' => 'First'],
            'created_at' => now()->subDays(2),
        ]);

        $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\TaskDeadlineNotification',
            'data' => ['title' => 'Second'],
            'created_at' => now()->subDay(),
        ]);

        $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\TaskDeadlineNotification',
            'data' => ['title' => 'Third'],
            'created_at' => now(),
        ]);

        $this->actingAsUser();

        $response = $this->getJson('/api/notifications', $this->withTenantHeaders());

        $response->assertOk();
        $notifications = $response->json('data');
        $this->assertEquals('Third', $notifications[0]['data']['title']);
        $this->assertEquals('Second', $notifications[1]['data']['title']);
        $this->assertEquals('First', $notifications[2]['data']['title']);
    }

    // ==================== UNREAD COUNT TESTS ====================

    public function test_can_get_unread_count(): void
    {
        // Create read and unread notifications
        $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\TaskDeadlineNotification',
            'data' => ['title' => 'Unread 1'],
            'read_at' => null,
        ]);

        $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\TaskDeadlineNotification',
            'data' => ['title' => 'Unread 2'],
            'read_at' => null,
        ]);

        $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\TaskDeadlineNotification',
            'data' => ['title' => 'Read'],
            'read_at' => now(),
        ]);

        $this->actingAsUser();

        $response = $this->getJson('/api/notifications/unread-count', $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure(['count']);

        $this->assertEquals(2, $response->json('count'));
    }

    // ==================== MARK AS READ TESTS ====================

    public function test_can_mark_notification_as_read(): void
    {
        $notification = $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\TaskDeadlineNotification',
            'data' => ['title' => 'Notification'],
            'read_at' => null,
        ]);

        $this->actingAsUser();

        $response = $this->postJson("/api/notifications/{$notification->id}/read", [], $this->withTenantHeaders());

        $response->assertOk();

        $notification->refresh();
        $this->assertNotNull($notification->read_at);
    }

    public function test_can_mark_all_as_read(): void
    {
        $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\TaskDeadlineNotification',
            'data' => ['title' => 'Notification 1'],
            'read_at' => null,
        ]);

        $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\TaskDeadlineNotification',
            'data' => ['title' => 'Notification 2'],
            'read_at' => null,
        ]);

        $this->actingAsUser();

        $response = $this->postJson('/api/notifications/mark-all-read', [], $this->withTenantHeaders());

        $response->assertOk();

        $this->assertEquals(0, $this->user->unreadNotifications()->count());
    }

    // ==================== DELETE TESTS ====================

    public function test_can_delete_notification(): void
    {
        $notification = $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\TaskDeadlineNotification',
            'data' => ['title' => 'To Delete'],
        ]);

        $this->actingAsUser();

        $response = $this->deleteJson("/api/notifications/{$notification->id}", [], $this->withTenantHeaders());

        $response->assertOk();

        $this->assertDatabaseMissing('notifications', [
            'id' => $notification->id,
        ]);
    }

    public function test_can_delete_all_read_notifications(): void
    {
        $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\TaskDeadlineNotification',
            'data' => ['title' => 'Read 1'],
            'read_at' => now(),
        ]);

        $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\TaskDeadlineNotification',
            'data' => ['title' => 'Read 2'],
            'read_at' => now(),
        ]);

        $unreadNotification = $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\TaskDeadlineNotification',
            'data' => ['title' => 'Unread'],
            'read_at' => null,
        ]);

        $this->actingAsUser();

        $response = $this->deleteJson('/api/notifications/read', [], $this->withTenantHeaders());

        $response->assertOk();

        $this->assertEquals(1, $this->user->notifications()->count());
        $this->assertDatabaseHas('notifications', [
            'id' => $unreadNotification->id,
        ]);
    }

    // ==================== PREFERENCES TESTS ====================

    public function test_can_get_notification_preferences(): void
    {
        $this->actingAsUser();

        $response = $this->getJson('/api/notifications/preferences', $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'daily_notifications',
                'weekly_notifications',
                'monthly_notifications',
            ]);
    }

    public function test_can_update_notification_preferences(): void
    {
        $this->actingAsUser();

        $response = $this->putJson('/api/notifications/preferences', [
            'daily_notifications' => true,
            'weekly_notifications' => false,
            'monthly_notifications' => true,
        ], $this->withTenantHeaders());

        $response->assertOk();
    }

    // ==================== AUTHENTICATION TESTS ====================

    public function test_unauthenticated_user_cannot_access_notifications(): void
    {
        $response = $this->getJson('/api/notifications');

        $response->assertUnauthorized();
    }

    public function test_user_cannot_access_other_user_notifications(): void
    {
        $otherUser = User::factory()->create();
        $notification = $otherUser->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\TaskDeadlineNotification',
            'data' => ['title' => 'Private'],
        ]);

        $this->actingAsUser();

        $response = $this->postJson("/api/notifications/{$notification->id}/read", [], $this->withTenantHeaders());

        $response->assertNotFound();
    }
}
