<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Infrastructure\Persistence\Models\User;
use App\Infrastructure\Persistence\Models\Group;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UserTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->createUserWithGroup();
        Mail::fake();
    }

    // ==================== INDEX TESTS ====================

    public function test_can_list_users(): void
    {
        $member = User::factory()->create();
        $this->group->users()->attach($member->id, ['is_admin' => false]);

        $this->actingAsUser();

        $response = $this->getJson('/api/users', $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure(['users']);

        // Owner + member = 2 users
        $this->assertCount(2, $response->json('users'));
    }

    public function test_cannot_list_users_without_auth(): void
    {
        $response = $this->getJson('/api/users');

        $response->assertUnauthorized();
    }

    public function test_list_only_users_from_accessible_groups(): void
    {
        $otherGroup = Group::factory()->create();
        $otherUser = User::factory()->create();
        $otherGroup->users()->attach($otherUser->id, ['is_admin' => false]);

        $this->actingAsUser();

        $response = $this->getJson('/api/users', $this->withTenantHeaders());

        $response->assertOk();
        $this->assertCount(1, $response->json('users'));
    }

    public function test_can_filter_users_by_active_status(): void
    {
        $activeUser = User::factory()->create(['is_active' => true]);
        $inactiveUser = User::factory()->create(['is_active' => false]);

        $this->group->users()->attach($activeUser->id, ['is_admin' => false]);
        $this->group->users()->attach($inactiveUser->id, ['is_admin' => false]);

        $this->actingAsUser();

        $response = $this->getJson('/api/users?is_active=true', $this->withTenantHeaders());

        $response->assertOk();
        // Owner (active) + activeUser = 2
        $users = $response->json('users');
        foreach ($users as $user) {
            $this->assertTrue($user['is_active']);
        }
    }

    public function test_can_search_users(): void
    {
        $user1 = User::factory()->create(['name' => 'John Doe', 'email' => 'john@example.com']);
        $user2 = User::factory()->create(['name' => 'Jane Smith', 'email' => 'jane@example.com']);

        $this->group->users()->attach($user1->id, ['is_admin' => false]);
        $this->group->users()->attach($user2->id, ['is_admin' => false]);

        $this->actingAsUser();

        $response = $this->getJson('/api/users?search=john', $this->withTenantHeaders());

        $response->assertOk();
        $users = $response->json('users');
        $this->assertCount(1, $users);
        $this->assertEquals('John Doe', $users[0]['name']);
    }

    // ==================== STORE TESTS ====================

    public function test_admin_can_create_user(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'group_id' => $this->group->id,
        ], $this->withTenantHeaders());

        $response->assertCreated()
            ->assertJsonPath('message', 'Usuario criado com sucesso.')
            ->assertJsonStructure(['user', 'temporary_password']);

        $this->assertDatabaseHas('users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
        ]);
    }

    public function test_created_user_is_added_to_group(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/users', [
            'name' => 'Group Member',
            'email' => 'member@example.com',
            'group_id' => $this->group->id,
            'is_admin' => true,
        ], $this->withTenantHeaders());

        $response->assertCreated();

        $newUser = User::where('email', 'member@example.com')->first();
        $this->assertTrue($newUser->groups()->where('groups.id', $this->group->id)->exists());
        $this->assertEquals(1, $newUser->groups()->first()->pivot->is_admin);
    }

    public function test_cannot_create_user_without_required_fields(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/users', [], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'group_id']);
    }

    public function test_cannot_create_user_with_duplicate_email(): void
    {
        $existingUser = User::factory()->create(['email' => 'existing@example.com']);

        $this->actingAsUser();

        $response = $this->postJson('/api/users', [
            'name' => 'New User',
            'email' => 'existing@example.com',
            'group_id' => $this->group->id,
        ], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_cannot_create_user_for_non_admin_group(): void
    {
        $otherGroup = Group::factory()->create();

        $this->actingAsUser();

        $response = $this->postJson('/api/users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'group_id' => $otherGroup->id,
        ], $this->withTenantHeaders());

        $response->assertForbidden();
    }

    // ==================== SHOW TESTS ====================

    public function test_can_show_user(): void
    {
        $member = User::factory()->create();
        $this->group->users()->attach($member->id, ['is_admin' => false]);

        $this->actingAsUser();

        $response = $this->getJson("/api/users/{$member->id}", $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email', 'avatar', 'language'],
            ]);
    }

    public function test_cannot_show_user_from_other_group(): void
    {
        $otherGroup = Group::factory()->create();
        $otherUser = User::factory()->create();
        $otherGroup->users()->attach($otherUser->id, ['is_admin' => false]);

        $this->actingAsUser();

        $response = $this->getJson("/api/users/{$otherUser->id}", $this->withTenantHeaders());

        $response->assertNotFound();
    }

    // ==================== UPDATE TESTS ====================

    public function test_user_can_update_own_profile(): void
    {
        $this->actingAsUser();

        $response = $this->putJson("/api/users/{$this->user->id}", [
            'name' => 'Updated Name',
            'language' => 'en',
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonPath('user.name', 'Updated Name')
            ->assertJsonPath('user.language', 'en');
    }

    public function test_user_cannot_update_other_users_profile(): void
    {
        $otherUser = User::factory()->create();
        $this->group->users()->attach($otherUser->id, ['is_admin' => false]);

        $this->actingAsUser();

        $response = $this->putJson("/api/users/{$otherUser->id}", [
            'name' => 'Hacked Name',
        ], $this->withTenantHeaders());

        $response->assertForbidden();
    }

    public function test_validates_language_on_update(): void
    {
        $this->actingAsUser();

        $response = $this->putJson("/api/users/{$this->user->id}", [
            'language' => 'invalid',
        ], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['language']);
    }

    // ==================== UPDATE NOTIFICATIONS TESTS ====================

    public function test_user_can_update_notification_preferences(): void
    {
        $this->actingAsUser();

        $response = $this->putJson("/api/users/{$this->user->id}/notifications", [
            'daily_notifications' => false,
            'weekly_notifications' => true,
            'monthly_notifications' => false,
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonPath('user.daily_notifications', false)
            ->assertJsonPath('user.weekly_notifications', true)
            ->assertJsonPath('user.monthly_notifications', false);
    }

    public function test_cannot_update_other_users_notifications(): void
    {
        $otherUser = User::factory()->create();
        $this->group->users()->attach($otherUser->id, ['is_admin' => false]);

        $this->actingAsUser();

        $response = $this->putJson("/api/users/{$otherUser->id}/notifications", [
            'daily_notifications' => false,
        ], $this->withTenantHeaders());

        $response->assertForbidden();
    }

    // ==================== UPLOAD AVATAR TESTS ====================

    public function test_user_can_upload_avatar(): void
    {
        Storage::fake('public');

        $this->actingAsUser();

        // Create a simple fake image file without GD extension
        $fakeImage = UploadedFile::fake()->create('avatar.png', 100, 'image/png');

        $response = $this->postJson("/api/users/{$this->user->id}/avatar", [
            'avatar' => $fakeImage,
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonPath('message', 'Avatar atualizado com sucesso!');

        $this->assertNotNull($this->user->fresh()->avatar);
    }

    public function test_cannot_upload_avatar_for_other_user(): void
    {
        $otherUser = User::factory()->create();
        $this->group->users()->attach($otherUser->id, ['is_admin' => false]);

        $this->actingAsUser();

        $fakeImage = UploadedFile::fake()->create('avatar.png', 100, 'image/png');

        $response = $this->postJson("/api/users/{$otherUser->id}/avatar", [
            'avatar' => $fakeImage,
        ], $this->withTenantHeaders());

        $response->assertForbidden();
    }

    public function test_avatar_must_be_image(): void
    {
        $this->actingAsUser();

        $response = $this->postJson("/api/users/{$this->user->id}/avatar", [
            'avatar' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
        ], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['avatar']);
    }

    // ==================== DELETE/DEACTIVATE TESTS ====================

    public function test_admin_can_deactivate_user(): void
    {
        $member = User::factory()->create(['is_active' => true]);
        $this->group->users()->attach($member->id, ['is_admin' => false]);

        $this->actingAsUser();

        $response = $this->deleteJson("/api/users/{$member->id}", [], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonPath('message', 'Usuario desativado com sucesso.');

        $this->assertFalse($member->fresh()->is_active);
    }

    public function test_cannot_delete_own_account(): void
    {
        $this->actingAsUser();

        $response = $this->deleteJson("/api/users/{$this->user->id}", [], $this->withTenantHeaders());

        $response->assertStatus(400)
            ->assertJsonPath('message', 'Voce nao pode remover sua propria conta.');
    }

    public function test_non_admin_cannot_delete_users(): void
    {
        $member = User::factory()->create();
        $targetUser = User::factory()->create();

        $this->group->users()->attach($member->id, ['is_admin' => false]);
        $this->group->users()->attach($targetUser->id, ['is_admin' => false]);

        $this->actingAsUser($member);

        $response = $this->deleteJson("/api/users/{$targetUser->id}", [], [
            'X-Tenant-Group-Ids' => $this->group->id,
        ]);

        $response->assertForbidden();
    }

    // ==================== TOGGLE ACTIVE TESTS ====================

    public function test_admin_can_toggle_user_active_status(): void
    {
        $member = User::factory()->create(['is_active' => true]);
        $this->group->users()->attach($member->id, ['is_admin' => false]);

        $this->actingAsUser();

        $response = $this->patchJson("/api/users/{$member->id}/toggle-active", [], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonPath('message', 'Usuario desativado.');

        $this->assertFalse($member->fresh()->is_active);
    }

    public function test_can_reactivate_user(): void
    {
        $member = User::factory()->create(['is_active' => false]);
        $this->group->users()->attach($member->id, ['is_admin' => false]);

        $this->actingAsUser();

        $response = $this->patchJson("/api/users/{$member->id}/toggle-active", [], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonPath('message', 'Usuario ativado.');

        $this->assertTrue($member->fresh()->is_active);
    }

    public function test_cannot_toggle_own_status(): void
    {
        $this->actingAsUser();

        $response = $this->patchJson("/api/users/{$this->user->id}/toggle-active", [], $this->withTenantHeaders());

        $response->assertStatus(400)
            ->assertJsonPath('message', 'Voce nao pode alterar seu proprio status.');
    }

    // ==================== UPDATE PASSWORD TESTS ====================

    public function test_user_can_update_own_password(): void
    {
        $this->actingAsUser();

        $response = $this->putJson("/api/users/{$this->user->id}/password", [
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonPath('message', 'Senha alterada com sucesso.');

        $this->assertTrue(Hash::check('newpassword123', $this->user->fresh()->password));
    }

    public function test_admin_can_update_other_users_password(): void
    {
        $member = User::factory()->create();
        $this->group->users()->attach($member->id, ['is_admin' => false]);

        $this->actingAsUser();

        $response = $this->putJson("/api/users/{$member->id}/password", [
            'password' => 'adminsetpassword',
            'password_confirmation' => 'adminsetpassword',
        ], $this->withTenantHeaders());

        $response->assertOk();
        $this->assertTrue(Hash::check('adminsetpassword', $member->fresh()->password));
    }

    public function test_password_requires_confirmation(): void
    {
        $this->actingAsUser();

        $response = $this->putJson("/api/users/{$this->user->id}/password", [
            'password' => 'newpassword123',
        ], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_password_must_be_minimum_length(): void
    {
        $this->actingAsUser();

        $response = $this->putJson("/api/users/{$this->user->id}/password", [
            'password' => '123',
            'password_confirmation' => '123',
        ], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_non_admin_cannot_update_other_users_password(): void
    {
        $member = User::factory()->create();
        $targetUser = User::factory()->create();

        $this->group->users()->attach($member->id, ['is_admin' => false]);
        $this->group->users()->attach($targetUser->id, ['is_admin' => false]);

        $this->actingAsUser($member);

        $response = $this->putJson("/api/users/{$targetUser->id}/password", [
            'password' => 'hackedpassword',
            'password_confirmation' => 'hackedpassword',
        ], ['X-Tenant-Group-Ids' => $this->group->id]);

        $response->assertForbidden();
    }
}
