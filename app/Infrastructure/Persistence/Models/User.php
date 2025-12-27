<?php

namespace App\Infrastructure\Persistence\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'username',
        'password',
        'avatar',
        'new_email',
        'reset_code',
        'reset_code_expiration',
        'confirmation_token',
        'confirmed_at',
        'last_change_password',
        'phone',
        'language',
        'monthly_notifications',
        'weekly_notifications',
        'daily_notifications',
        'favorite_task_filter',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'reset_code',
        'confirmation_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'last_change_password' => 'datetime',
            'reset_code_expiration' => 'datetime',
            'password' => 'hashed',
            'monthly_notifications' => 'boolean',
            'weekly_notifications' => 'boolean',
            'daily_notifications' => 'boolean',
            'favorite_task_filter' => 'array',
        ];
    }

    // Relationships
    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class, 'user_groups')
            ->withPivot('is_admin')
            ->withTimestamps();
    }

    public function ownedGroups(): HasMany
    {
        return $this->hasMany(Group::class, 'owner_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'responsible');
    }

    public function invitationsCreated(): HasMany
    {
        return $this->hasMany(Invitation::class, 'creator_id');
    }

    public function invitationsReceived(): HasMany
    {
        return $this->hasMany(Invitation::class, 'user_allowed_id');
    }

    public function timelines(): HasMany
    {
        return $this->hasMany(Timeline::class);
    }

    public function approvers(): HasMany
    {
        return $this->hasMany(Approver::class);
    }

    public function approverSignatures(): HasMany
    {
        return $this->hasMany(ApproverSignature::class);
    }

    // Helper methods
    public function accessibleGroups()
    {
        return $this->groups()->where('deleted', false)->get();
    }

    public function accessibleGroupIds(): array
    {
        return $this->groups()
            ->where('deleted', false)
            ->pluck('groups.id')
            ->toArray();
    }

    public function adminGroupIds(): array
    {
        return $this->groups()
            ->where('deleted', false)
            ->wherePivot('is_admin', true)
            ->pluck('groups.id')
            ->toArray();
    }

    public function ownerGroupIds(): array
    {
        return $this->ownedGroups()
            ->where('deleted', false)
            ->pluck('id')
            ->toArray();
    }

    public function isOwnerOf(Group $group): bool
    {
        return $this->id === $group->owner_id;
    }

    public function isAdminOf(Group $group): bool
    {
        return $this->groups()
            ->where('groups.id', $group->id)
            ->wherePivot('is_admin', true)
            ->exists();
    }

    public function isMemberOf(Group $group): bool
    {
        return $this->groups()
            ->where('groups.id', $group->id)
            ->exists();
    }

    public function canManageGroup(Group $group): bool
    {
        return $this->isOwnerOf($group) || $this->isAdminOf($group);
    }

    public function generateConfirmationToken(): string
    {
        $token = strtoupper(substr(md5(uniqid()), 0, 10));
        $this->confirmation_token = $token;
        return $token;
    }

    public function generateResetCode(): string
    {
        $code = bin2hex(random_bytes(32));
        $this->reset_code = $code;
        $this->reset_code_expiration = now()->addHours(24);
        return $code;
    }
}
