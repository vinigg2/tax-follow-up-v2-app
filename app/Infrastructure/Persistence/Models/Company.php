<?php

namespace App\Infrastructure\Persistence\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'cnpj',
        'name',
        'country',
        'logo',
        'group_id',
        'deleted',
    ];

    protected function casts(): array
    {
        return [
            'deleted' => 'boolean',
        ];
    }

    // Relationships
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
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

    public function scopeByCountry($query, $country)
    {
        return $query->where('country', $country);
    }

    // Accessors
    public function getFormattedCnpjAttribute(): string
    {
        $cnpj = preg_replace('/[^0-9]/', '', $this->cnpj);

        if (strlen($cnpj) === 14) {
            return preg_replace(
                '/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/',
                '$1.$2.$3/$4-$5',
                $cnpj
            );
        }

        return $this->cnpj;
    }

    // Helper methods
    public function getTaskStats(): array
    {
        $tasks = $this->activeTasks;

        return [
            'total' => $tasks->count(),
            'new' => $tasks->where('status', 'new')->count(),
            'pending' => $tasks->where('status', 'pending')->count(),
            'delayed' => $tasks->where('status', 'late')->count(),
            'finished' => $tasks->where('status', 'finished')->count(),
            'rectified' => $tasks->where('status', 'rectified')->count(),
        ];
    }
}
