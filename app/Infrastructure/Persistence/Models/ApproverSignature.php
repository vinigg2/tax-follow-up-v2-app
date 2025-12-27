<?php

namespace App\Infrastructure\Persistence\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApproverSignature extends Model
{
    use HasFactory;

    protected $fillable = [
        'sequence',
        'user_id',
        'document_id',
        'status',
        'comment',
        'signed_at',
    ];

    protected function casts(): array
    {
        return [
            'signed_at' => 'datetime',
        ];
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeSigned($query)
    {
        return $query->where('status', 'signed');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    // Helper methods
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isSigned(): bool
    {
        return $this->status === 'signed';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function sign(?string $comment = null): void
    {
        $this->status = 'signed';
        $this->signed_at = now();
        $this->comment = $comment;
        $this->save();
    }

    public function reject(string $comment): void
    {
        $this->status = 'rejected';
        $this->signed_at = now();
        $this->comment = $comment;
        $this->save();
    }
}
