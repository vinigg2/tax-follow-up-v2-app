<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Models\User;
use App\Infrastructure\Persistence\Models\Group;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Group $group;

    protected function setUp(): void
    {
        parent::setUp();
    }

    protected function createUserWithGroup(string $role = 'owner'): User
    {
        $this->user = User::factory()->create([
            'is_active' => true,
        ]);

        $this->group = Group::factory()->create([
            'owner_id' => $this->user->id,
        ]);

        // Map role to pivot: owner/admin -> 'admin', manager -> 'manager', member -> 'member'
        $pivotRole = match ($role) {
            'owner', 'admin' => 'admin',
            'manager' => 'manager',
            default => 'member',
        };

        $this->user->groups()->attach($this->group->id, [
            'role' => $pivotRole,
        ]);

        return $this->user;
    }

    protected function actingAsUser(?User $user = null): self
    {
        $user = $user ?? $this->user ?? $this->createUserWithGroup();

        Sanctum::actingAs($user);

        return $this;
    }

    protected function getAccessibleGroupIds(): array
    {
        return [$this->group->id];
    }

    protected function withTenantHeaders(): array
    {
        return [
            'X-Tenant-Group-Ids' => implode(',', $this->getAccessibleGroupIds()),
        ];
    }
}
