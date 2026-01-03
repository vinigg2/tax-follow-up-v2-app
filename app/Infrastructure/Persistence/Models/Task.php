<?php

namespace App\Infrastructure\Persistence\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;

    protected static function newFactory(): \Database\Factories\TaskFactory
    {
        return \Database\Factories\TaskFactory::new();
    }

    protected $fillable = [
        'title',
        'description',
        'is_active',
        'deadline',
        'conclusion_date',
        'status',
        'cause_id',
        'company_id',
        'group_id',
        'task_corrected',
        'responsible',
        'cause_version',
        'percent',
        'competency',
        'delayed_days',
        'deleted',
        'dynamic_fields',
        'flowchart_fields',
    ];

    protected function casts(): array
    {
        return [
            'deadline' => 'date',
            'conclusion_date' => 'date',
            'is_active' => 'boolean',
            'deleted' => 'boolean',
            'dynamic_fields' => 'array',
            'flowchart_fields' => 'array',
            'percent' => 'decimal:2',
        ];
    }

    protected $appends = ['task_hierarchy_title', 'responsible_name', 'formatted_deadline'];

    // Relationships
    public function obligation(): BelongsTo
    {
        return $this->belongsTo(Obligation::class, 'cause_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function responsibleUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsible');
    }

    public function correctedTask(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'task_corrected');
    }

    public function corrections(): HasMany
    {
        return $this->hasMany(Task::class, 'task_corrected');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function timelines(): HasMany
    {
        return $this->hasMany(Timeline::class)->orderBy('created_at', 'desc');
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(Checklist::class)->orderBy('order');
    }

    // Accessors
    protected function taskHierarchyTitle(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->task_corrected !== null) {
                    $correctionCounter = 1;
                    $parentTask = $this->correctedTask;

                    while ($parentTask && $parentTask->task_corrected !== null) {
                        $parentTask = $parentTask->correctedTask;
                        $correctionCounter++;
                    }

                    return $this->title . " ({$correctionCounter}a Retificacao)";
                }
                return $this->title;
            }
        );
    }

    protected function responsibleName(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->responsibleUser?->name
        );
    }

    protected function formattedDeadline(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!$this->deadline) {
                    return null;
                }

                $language = $this->responsibleUser?->language ?? 'en';
                $format = $language === 'pt' ? 'd/m/Y' : 'Y-m-d';

                return $this->deadline->format($format);
            }
        );
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('deleted', false);
    }

    public function scopeForGroup($query, $groupIds)
    {
        return $query->whereIn('group_id', (array) $groupIds);
    }

    public function scopeForCompany($query, $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeWithStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeNotCompleted($query)
    {
        return $query->whereNotIn('status', ['finished', 'rectified']);
    }

    public function scopeCompleted($query)
    {
        return $query->whereIn('status', ['finished', 'rectified']);
    }

    public function scopeDelayed($query)
    {
        return $query->where('status', 'late');
    }

    public function scopeArchived($query)
    {
        return $query->where('is_active', false);
    }

    public function scopeNotArchived($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByDeadlineRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('deadline', [$startDate, $endDate]);
    }

    // Helper methods
    public function isDelayed(): bool
    {
        return $this->status === 'late' || ($this->deadline && $this->deadline->isPast() && !in_array($this->status, ['finished', 'rectified']));
    }

    public function calculateProgress(): float
    {
        $obligatoryDocs = $this->documents()->where('is_obligatory', true)->get();

        if ($obligatoryDocs->isEmpty()) {
            return 0;
        }

        $totalDays = $obligatoryDocs->sum('estimated_days');
        $completedDays = $obligatoryDocs
            ->where('status', 'finished')
            ->sum('estimated_days');

        return $totalDays > 0 ? round(($completedDays / $totalDays) * 100, 2) : 0;
    }

    public function updateProgress(): void
    {
        $this->percent = $this->calculateProgress();
        $this->save();
    }

    public function archive(): void
    {
        $this->is_active = false;
        $this->save();
    }

    public function unarchive(): void
    {
        $this->is_active = true;
        $this->save();
    }

    public function markAsFinished(): void
    {
        $this->status = 'finished';
        $this->conclusion_date = now();
        $this->percent = 100;
        $this->save();
    }
}
