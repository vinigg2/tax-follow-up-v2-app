<?php

namespace App\Infrastructure\Persistence\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Group extends Model
{
    use HasFactory;

    protected static function newFactory(): \Database\Factories\GroupFactory
    {
        return \Database\Factories\GroupFactory::new();
    }

    protected $fillable = [
        'name',
        'owner_id',
        'deleted',
    ];

    protected function casts(): array
    {
        return [
            'deleted' => 'boolean',
        ];
    }

    // Relationships
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_groups')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function admins(): BelongsToMany
    {
        return $this->users()->wherePivot('role', 'admin');
    }

    public function managers(): BelongsToMany
    {
        return $this->users()->wherePivot('role', 'manager');
    }

    public function members(): BelongsToMany
    {
        return $this->users()->wherePivot('role', 'member');
    }

    public function companies(): HasMany
    {
        return $this->hasMany(Company::class);
    }

    public function activeCompanies(): HasMany
    {
        return $this->hasMany(Company::class)->where('deleted', false);
    }

    public function obligations(): HasMany
    {
        return $this->hasMany(Obligation::class);
    }

    public function activeObligations(): HasMany
    {
        return $this->hasMany(Obligation::class)->where('deleted', false);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function activeTasks(): HasMany
    {
        return $this->hasMany(Task::class)->where('deleted', false);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function documentTypes(): HasMany
    {
        return $this->hasMany(DocumentType::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

    public function bucket(): HasOne
    {
        return $this->hasOne(Bucket::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('deleted', false);
    }

    // Helper methods

    /**
     * Add a user to the group with a specific role
     * @param User $user
     * @param string $role 'admin', 'manager', or 'member'
     */
    public function addUser(User $user, string $role = 'member'): void
    {
        $this->users()->syncWithoutDetaching([
            $user->id => ['role' => $role]
        ]);
    }

    public function removeUser(User $user): void
    {
        $this->users()->detach($user->id);
    }

    public function setUserRole(User $user, string $role): void
    {
        $this->users()->updateExistingPivot($user->id, ['role' => $role]);
    }

    public function setUserAsAdmin(User $user): void
    {
        $this->setUserRole($user, 'admin');
    }

    public function setUserAsManager(User $user): void
    {
        $this->setUserRole($user, 'manager');
    }

    public function setUserAsMember(User $user): void
    {
        $this->setUserRole($user, 'member');
    }

    public function getUserRole(User $user): ?string
    {
        if ($this->owner_id === $user->id) {
            return 'owner';
        }

        $pivot = $this->users()->where('user_id', $user->id)->first()?->pivot;

        if (!$pivot) {
            return null;
        }

        return $pivot->role;
    }
}
