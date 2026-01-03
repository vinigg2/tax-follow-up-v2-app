<?php

namespace App\Infrastructure\Persistence\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    use HasFactory;

    protected static function newFactory(): \Database\Factories\DocumentFactory
    {
        return \Database\Factories\DocumentFactory::new();
    }

    protected $fillable = [
        'submission_date',
        'document_path',
        'document_type_id',
        'sender_id',
        'task_id',
        'company_id',
        'group_id',
        'status',
        'start_date',
        'finish_date',
        'name',
        'description',
        'is_obligatory',
        'estimated_days',
        'required_file',
        'approval_required',
        'file_size_bytes',
        'order_items',
    ];

    protected function casts(): array
    {
        return [
            'submission_date' => 'date',
            'start_date' => 'date',
            'finish_date' => 'date',
            'is_obligatory' => 'boolean',
            'required_file' => 'boolean',
        ];
    }

    // Relationships
    public function documentType(): BelongsTo
    {
        return $this->belongsTo(DocumentType::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function approverSignatures(): HasMany
    {
        return $this->hasMany(ApproverSignature::class)->orderBy('sequence');
    }

    public function timelines(): HasMany
    {
        return $this->hasMany(Timeline::class)->orderBy('created_at', 'desc');
    }

    // Scopes
    public function scopeForTask($query, $taskId)
    {
        return $query->where('task_id', $taskId);
    }

    public function scopeObligatory($query)
    {
        return $query->where('is_obligatory', true);
    }

    public function scopeOptional($query)
    {
        return $query->where('is_obligatory', false);
    }

    public function scopeFinished($query)
    {
        return $query->where('status', 'finished');
    }

    public function scopePending($query)
    {
        return $query->whereNotIn('status', ['finished', 'unstarted']);
    }

    // Helper methods
    public function isFinished(): bool
    {
        return $this->status === 'finished';
    }

    public function isUnstarted(): bool
    {
        return $this->status === 'unstarted';
    }

    public function requiresApproval(): bool
    {
        return in_array($this->approval_required, ['S', 'P']);
    }

    public function isSequentialApproval(): bool
    {
        return $this->approval_required === 'S';
    }

    public function isParallelApproval(): bool
    {
        return $this->approval_required === 'P';
    }

    public function hasFile(): bool
    {
        return !empty($this->document_path);
    }

    public function start(): void
    {
        $this->status = 'started';
        $this->start_date = now();
        $this->save();
    }

    public function finish(): void
    {
        $this->status = 'finished';
        $this->finish_date = now();
        $this->save();
    }

    public function reset(): void
    {
        $this->status = 'restarted';
        $this->document_path = null;
        $this->file_size_bytes = null;
        $this->finish_date = null;
        $this->save();

        // Reset all signatures
        $this->approverSignatures()->update(['status' => null, 'signed_at' => null]);
    }

    public function sendForApproval(): void
    {
        $this->status = 'on_approval';
        $this->save();

        // Initialize approval signatures
        if ($this->isSequentialApproval()) {
            $this->initializeSequentialApproval();
        } else {
            $this->initializeParallelApproval();
        }
    }

    protected function initializeSequentialApproval(): void
    {
        $firstSignature = $this->approverSignatures()->where('sequence', 1)->first();
        if ($firstSignature) {
            $firstSignature->update(['status' => 'pending']);
        }
    }

    protected function initializeParallelApproval(): void
    {
        $this->approverSignatures()->update(['status' => 'pending']);
    }

    public function getCurrentApprover(): ?ApproverSignature
    {
        return $this->approverSignatures()
            ->where('status', 'pending')
            ->orderBy('sequence')
            ->first();
    }

    public function isFullyApproved(): bool
    {
        if (!$this->requiresApproval()) {
            return true;
        }

        return $this->approverSignatures()
            ->where('status', '!=', 'signed')
            ->doesntExist();
    }

    public function getFileSizeFormatted(): string
    {
        if (!$this->file_size_bytes) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $size = $this->file_size_bytes;
        $unitIndex = 0;

        while ($size >= 1024 && $unitIndex < count($units) - 1) {
            $size /= 1024;
            $unitIndex++;
        }

        return round($size, 2) . ' ' . $units[$unitIndex];
    }
}
