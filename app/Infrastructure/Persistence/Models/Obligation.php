<?php

namespace App\Infrastructure\Persistence\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Obligation extends Model
{
    use HasFactory;

    protected static function newFactory(): \Database\Factories\ObligationFactory
    {
        return \Database\Factories\ObligationFactory::new();
    }

    protected $fillable = [
        'title',
        'description',
        'frequency',
        'day_deadline',
        'month_deadline',
        'group_id',
        'version',
        'initial_generation_date',
        'final_generation_date',
        'period',
        'kind',
        'last_competence',
        'last_year_month_qt',
        'months_advanced',
        'generate_automatic_tasks',
        'show_dashboard',
        'deleted',
        'dynamic_fields',
        'flowchart_fields',
    ];

    protected function casts(): array
    {
        return [
            'initial_generation_date' => 'date',
            'final_generation_date' => 'date',
            'generate_automatic_tasks' => 'boolean',
            'show_dashboard' => 'boolean',
            'deleted' => 'boolean',
            'dynamic_fields' => 'array',
            'flowchart_fields' => 'array',
        ];
    }

    // Relationships
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function documentTypes(): HasMany
    {
        return $this->hasMany(DocumentType::class)->orderBy('order_items');
    }

    public function activeDocumentTypes(): HasMany
    {
        return $this->documentTypes()->where('obligation_version', $this->version);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'cause_id');
    }

    public function activeTasks(): HasMany
    {
        return $this->tasks()->where('deleted', false);
    }

    public function obligationCompanyUsers(): HasMany
    {
        return $this->hasMany(ObligationCompanyUser::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('deleted', false);
    }

    public function scopeForGroup($query, $groupId)
    {
        return $query->where('group_id', $groupId);
    }

    public function scopeWithAutomaticGeneration($query)
    {
        return $query->where('generate_automatic_tasks', true);
    }

    public function scopeByFrequency($query, $frequency)
    {
        return $query->where('frequency', $frequency);
    }

    // Helper methods
    public function isMonthly(): bool
    {
        return $this->frequency === 'MM';
    }

    public function isQuarterly(): bool
    {
        return $this->frequency === 'QT';
    }

    public function isAnnual(): bool
    {
        return $this->frequency === 'AA';
    }

    public function getFrequencyLabel(): string
    {
        return match ($this->frequency) {
            'MM' => 'Mensal',
            'QT' => 'Trimestral',
            'AA' => 'Anual',
            default => $this->frequency,
        };
    }

    public function incrementVersion(): void
    {
        $this->version++;
        $this->save();
    }

    public function getAssignedCompanies()
    {
        return Company::whereIn('id', $this->obligationCompanyUsers()->pluck('company_id'))
            ->where('deleted', false)
            ->get();
    }

    public function getResponsibleForCompany(Company $company): ?User
    {
        $ocu = $this->obligationCompanyUsers()
            ->where('company_id', $company->id)
            ->first();

        return $ocu?->user;
    }
}
