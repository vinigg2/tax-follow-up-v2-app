<?php

namespace App\Infrastructure\Persistence\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Checklist extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'title',
        'description',
        'status',
        'order',
        'assigned_to',
        'completed_at',
        'completed_by',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    /**
     * Status constants
     */
    public const STATUS_PENDENTE = 'pendente';
    public const STATUS_EM_ANDAMENTO = 'em_andamento';
    public const STATUS_CONCLUIDO = 'concluido';

    /**
     * Get the task that owns the checklist.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get the user assigned to this checklist item.
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the user who completed this checklist item.
     */
    public function completedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    /**
     * Check if the checklist item is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_CONCLUIDO;
    }

    /**
     * Check if the checklist item is in progress.
     */
    public function isInProgress(): bool
    {
        return $this->status === self::STATUS_EM_ANDAMENTO;
    }

    /**
     * Check if the checklist item is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDENTE;
    }

    /**
     * Mark the checklist item as completed.
     */
    public function markAsCompleted(?int $userId = null): void
    {
        $this->update([
            'status' => self::STATUS_CONCLUIDO,
            'completed_at' => now(),
            'completed_by' => $userId,
        ]);
    }

    /**
     * Mark the checklist item as in progress.
     */
    public function markAsInProgress(): void
    {
        $this->update([
            'status' => self::STATUS_EM_ANDAMENTO,
            'completed_at' => null,
            'completed_by' => null,
        ]);
    }

    /**
     * Mark the checklist item as pending.
     */
    public function markAsPending(): void
    {
        $this->update([
            'status' => self::STATUS_PENDENTE,
            'completed_at' => null,
            'completed_by' => null,
        ]);
    }

    /**
     * Scope: Order by order field
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }

    /**
     * Scope: Filter by status
     */
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Completed items
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_CONCLUIDO);
    }

    /**
     * Scope: Pending items
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDENTE);
    }

    /**
     * Scope: In progress items
     */
    public function scopeInProgress($query)
    {
        return $query->where('status', self::STATUS_EM_ANDAMENTO);
    }
}
