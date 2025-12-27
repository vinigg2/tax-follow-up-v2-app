<?php

namespace App\Infrastructure\Persistence\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_obligatory',
        'obligation_id',
        'group_id',
        'obligation_version',
        'estimated_days',
        'required_file',
        'approval_required',
        'order_items',
    ];

    protected function casts(): array
    {
        return [
            'is_obligatory' => 'boolean',
            'required_file' => 'boolean',
        ];
    }

    // Relationships
    public function obligation(): BelongsTo
    {
        return $this->belongsTo(Obligation::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function approvers(): HasMany
    {
        return $this->hasMany(Approver::class, 'document_type_id')->orderBy('sequence');
    }

    // Scopes
    public function scopeForObligation($query, $obligationId)
    {
        return $query->where('obligation_id', $obligationId);
    }

    public function scopeForVersion($query, $version)
    {
        return $query->where('obligation_version', $version);
    }

    public function scopeObligatory($query)
    {
        return $query->where('is_obligatory', true);
    }

    // Helper methods
    public function requiresApproval(): bool
    {
        return in_array($this->approval_required, ['S', 'P']);
    }

    public function getApprovalTypeLabel(): string
    {
        return match ($this->approval_required) {
            'N' => 'Nao requer',
            'S' => 'Sequencial',
            'P' => 'Paralelo',
            default => $this->approval_required,
        };
    }
}
