<?php

namespace App\Infrastructure\Persistence\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Invitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'is_valid',
        'creator_id',
        'is_admin_invitation',
        'group_id',
        'user_allowed_id',
        'guest_email',
        'expires_at',
        'accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'is_valid' => 'boolean',
            'is_admin_invitation' => 'boolean',
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    // Relationships
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function userAllowed(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_allowed_id');
    }

    // Scopes
    public function scopeValid($query)
    {
        return $query->where('is_valid', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    public function scopeForGroup($query, $groupId)
    {
        return $query->where('group_id', $groupId);
    }

    public function scopePending($query)
    {
        return $query->valid()->whereNull('accepted_at');
    }

    // Helper methods
    public static function generateCode(): string
    {
        do {
            $code = Str::random(32);
        } while (self::where('code', $code)->exists());

        return $code;
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isAccepted(): bool
    {
        return $this->accepted_at !== null;
    }

    public function canBeAccepted(): bool
    {
        return $this->is_valid && !$this->isExpired() && !$this->isAccepted();
    }

    public function accept(User $user): void
    {
        $this->user_allowed_id = $user->id;
        $this->accepted_at = now();
        $this->is_valid = false;
        $this->save();

        // Add user to group
        $this->group->addUser($user, $this->is_admin_invitation);
    }

    public function invalidate(): void
    {
        $this->is_valid = false;
        $this->save();
    }

    public static function createForEmail(
        Group $group,
        User $creator,
        string $email,
        bool $isAdmin = false,
        ?int $expirationDays = 7
    ): self {
        return self::create([
            'code' => self::generateCode(),
            'is_valid' => true,
            'creator_id' => $creator->id,
            'is_admin_invitation' => $isAdmin,
            'group_id' => $group->id,
            'guest_email' => strtolower($email),
            'expires_at' => $expirationDays ? now()->addDays($expirationDays) : null,
        ]);
    }
}
