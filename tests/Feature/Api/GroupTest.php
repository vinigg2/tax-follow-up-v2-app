<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Infrastructure\Persistence\Models\Group;
use App\Infrastructure\Persistence\Models\User;

class GroupTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->createUserWithGroup();
    }

    // ==================== INDEX TESTS ====================

    public function test_can_list_groups(): void
    {
        $this->actingAsUser();

        $response = $this->getJson('/api/groups', $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure(['groups']);

        $this->assertCount(1, $response->json('groups'));
    }

    public function test_cannot_list_groups_without_auth(): void
    {
        $response = $this->getJson('/api/groups');

        $response->assertUnauthorized();
    }

    public function test_list_only_accessible_groups(): void
    {
        $otherGroup = Group::factory()->create();

        $this->actingAsUser();

        $response = $this->getJson('/api/groups', $this->withTenantHeaders());

        $response->assertOk();
        $groups = $response->json('groups');
        $this->assertCount(1, $groups);
        $this->assertEquals($this->group->id, $groups[0]['id']);
    }

    public function test_list_excludes_deleted_groups(): void
    {
        // Create a second group to ensure we have one accessible
        $secondGroup = Group::factory()->create(['owner_id' => $this->user->id]);
        $this->user->groups()->attach($secondGroup->id, ['is_admin' => true]);

        // Delete the original group
        $this->group->update(['deleted' => true]);

        $this->actingAsUser();

        // Include both groups in tenant headers
        $response = $this->getJson('/api/groups', [
            'X-Tenant-Group-Ids' => $this->group->id . ',' . $secondGroup->id,
        ]);

        $response->assertOk();
        // Only the non-deleted group should be returned
        $this->assertCount(1, $response->json('groups'));
        $this->assertEquals($secondGroup->id, $response->json('groups.0.id'));
    }

    public function test_list_groups_includes_owner(): void
    {
        $this->actingAsUser();

        $response = $this->getJson('/api/groups', $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'groups' => [
                    '*' => ['id', 'name', 'owner_id', 'owner'],
                ],
            ]);
    }

    // ==================== SHOW TESTS ====================

    public function test_can_show_group(): void
    {
        $this->actingAsUser();

        $response = $this->getJson("/api/groups/{$this->group->id}", $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'group' => ['id', 'name', 'owner_id', 'owner', 'users'],
            ]);
    }

    public function test_cannot_show_group_from_other_tenant(): void
    {
        $otherGroup = Group::factory()->create();

        $this->actingAsUser();

        $response = $this->getJson("/api/groups/{$otherGroup->id}", $this->withTenantHeaders());

        $response->assertNotFound();
    }

    public function test_cannot_show_deleted_group(): void
    {
        // Create a second group so user still has access
        $secondGroup = Group::factory()->create(['owner_id' => $this->user->id]);
        $this->user->groups()->attach($secondGroup->id, ['is_admin' => true]);

        // Delete the original group
        $deletedGroupId = $this->group->id;
        $this->group->update(['deleted' => true]);

        $this->actingAsUser();

        $response = $this->getJson("/api/groups/{$deletedGroupId}", [
            'X-Tenant-Group-Ids' => $deletedGroupId . ',' . $secondGroup->id,
        ]);

        $response->assertNotFound();
    }

    // ==================== STORE TESTS ====================

    public function test_can_create_group(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/groups', [
            'name' => 'Novo Grupo',
        ], $this->withTenantHeaders());

        $response->assertCreated()
            ->assertJsonPath('group.name', 'Novo Grupo')
            ->assertJsonPath('message', 'Grupo criado com sucesso!');

        $this->assertDatabaseHas('groups', [
            'name' => 'Novo Grupo',
            'owner_id' => $this->user->id,
        ]);
    }

    public function test_creator_is_added_as_admin(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/groups', [
            'name' => 'Grupo Admin Test',
        ], $this->withTenantHeaders());

        $response->assertCreated();

        $newGroup = Group::where('name', 'Grupo Admin Test')->first();
        $this->assertEquals(
            1,
            $newGroup->users()->where('user_id', $this->user->id)->first()->pivot->is_admin
        );
    }

    public function test_cannot_create_group_without_name(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/groups', [], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_validates_name_max_length(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/groups', [
            'name' => str_repeat('a', 256),
        ], $this->withTenantHeaders());

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    // ==================== UPDATE TESTS ====================

    public function test_owner_can_update_group(): void
    {
        $this->actingAsUser();

        $response = $this->putJson("/api/groups/{$this->group->id}", [
            'name' => 'Grupo Atualizado',
        ], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonPath('group.name', 'Grupo Atualizado')
            ->assertJsonPath('message', 'Grupo atualizado com sucesso!');

        $this->assertDatabaseHas('groups', [
            'id' => $this->group->id,
            'name' => 'Grupo Atualizado',
        ]);
    }

    public function test_non_owner_cannot_update_group(): void
    {
        $member = User::factory()->create();
        $this->group->users()->attach($member->id, ['is_admin' => false]);

        $this->actingAsUser($member);

        // Member doesn't have owner_group_ids for this group
        $response = $this->putJson("/api/groups/{$this->group->id}", [
            'name' => 'Tentativa de Update',
        ], ['X-Tenant-Group-Ids' => $this->group->id]);

        $response->assertNotFound();
    }

    // ==================== DELETE TESTS ====================

    public function test_owner_can_delete_group(): void
    {
        $this->actingAsUser();

        $response = $this->deleteJson("/api/groups/{$this->group->id}", [], $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonPath('message', 'Grupo excluido com sucesso!');

        $this->assertDatabaseHas('groups', [
            'id' => $this->group->id,
            'deleted' => true,
        ]);
    }

    public function test_non_owner_cannot_delete_group(): void
    {
        $member = User::factory()->create();
        $this->group->users()->attach($member->id, ['is_admin' => true]);

        $this->actingAsUser($member);

        $response = $this->deleteJson("/api/groups/{$this->group->id}", [], [
            'X-Tenant-Group-Ids' => $this->group->id,
        ]);

        $response->assertNotFound();
    }

    // ==================== USERS TESTS ====================

    public function test_can_list_group_users(): void
    {
        $member1 = User::factory()->create(['name' => 'Member 1']);
        $member2 = User::factory()->create(['name' => 'Member 2']);

        $this->group->users()->attach($member1->id, ['is_admin' => false]);
        $this->group->users()->attach($member2->id, ['is_admin' => true]);

        $this->actingAsUser();

        $response = $this->getJson("/api/groups/{$this->group->id}/users", $this->withTenantHeaders());

        $response->assertOk()
            ->assertJsonStructure([
                'users' => [
                    '*' => ['id', 'name', 'email', 'avatar', 'is_admin'],
                ],
            ]);

        // Owner + 2 members = 3 users
        $this->assertCount(3, $response->json('users'));
    }

    public function test_cannot_list_users_from_other_group(): void
    {
        $otherGroup = Group::factory()->create();

        $this->actingAsUser();

        $response = $this->getJson("/api/groups/{$otherGroup->id}/users", $this->withTenantHeaders());

        $response->assertNotFound();
    }

    // ==================== REMOVE USER TESTS ====================

    public function test_admin_can_remove_user_from_group(): void
    {
        $member = User::factory()->create();
        $this->group->users()->attach($member->id, ['is_admin' => false]);

        $this->actingAsUser();

        $response = $this->deleteJson(
            "/api/groups/{$this->group->id}/users/{$member->id}",
            [],
            $this->withTenantHeaders()
        );

        $response->assertOk()
            ->assertJsonPath('message', 'Usuario removido do grupo com sucesso!');

        $this->assertDatabaseMissing('user_groups', [
            'group_id' => $this->group->id,
            'user_id' => $member->id,
        ]);
    }

    public function test_cannot_remove_owner_from_group(): void
    {
        $this->actingAsUser();

        $response = $this->deleteJson(
            "/api/groups/{$this->group->id}/users/{$this->user->id}",
            [],
            $this->withTenantHeaders()
        );

        $response->assertForbidden()
            ->assertJsonPath('message', 'Nao e possivel remover o proprietario do grupo');
    }

    public function test_non_admin_cannot_remove_user(): void
    {
        $member = User::factory()->create();
        $targetUser = User::factory()->create();

        $this->group->users()->attach($member->id, ['is_admin' => false]);
        $this->group->users()->attach($targetUser->id, ['is_admin' => false]);

        $this->actingAsUser($member);

        $response = $this->deleteJson(
            "/api/groups/{$this->group->id}/users/{$targetUser->id}",
            [],
            ['X-Tenant-Group-Ids' => $this->group->id]
        );

        $response->assertNotFound();
    }

    // ==================== UPDATE USER ROLE TESTS ====================

    public function test_admin_can_update_user_role(): void
    {
        $member = User::factory()->create();
        $this->group->users()->attach($member->id, ['is_admin' => false]);

        $this->actingAsUser();

        $response = $this->putJson(
            "/api/groups/{$this->group->id}/users/{$member->id}/role",
            ['is_admin' => true],
            $this->withTenantHeaders()
        );

        $response->assertOk()
            ->assertJsonPath('message', 'Funcao do usuario atualizada com sucesso!');

        $this->assertEquals(
            1,
            $this->group->users()->where('user_id', $member->id)->first()->pivot->is_admin
        );
    }

    public function test_cannot_change_owner_role(): void
    {
        $this->actingAsUser();

        $response = $this->putJson(
            "/api/groups/{$this->group->id}/users/{$this->user->id}/role",
            ['is_admin' => false],
            $this->withTenantHeaders()
        );

        $response->assertForbidden()
            ->assertJsonPath('message', 'Nao e possivel alterar a funcao do proprietario');
    }

    public function test_update_role_requires_is_admin_field(): void
    {
        $member = User::factory()->create();
        $this->group->users()->attach($member->id, ['is_admin' => false]);

        $this->actingAsUser();

        $response = $this->putJson(
            "/api/groups/{$this->group->id}/users/{$member->id}/role",
            [],
            $this->withTenantHeaders()
        );

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['is_admin']);
    }

    public function test_can_demote_admin_to_member(): void
    {
        $admin = User::factory()->create();
        $this->group->users()->attach($admin->id, ['is_admin' => true]);

        $this->actingAsUser();

        $response = $this->putJson(
            "/api/groups/{$this->group->id}/users/{$admin->id}/role",
            ['is_admin' => false],
            $this->withTenantHeaders()
        );

        $response->assertOk();

        $this->assertEquals(
            0,
            $this->group->users()->where('user_id', $admin->id)->first()->pivot->is_admin
        );
    }
}
