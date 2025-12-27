<?php

namespace App\Infrastructure\Persistence\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ObligationCompanyUser extends Model
{
    use HasFactory;

    protected $table = 'obligation_company_users';

    protected $fillable = [
        'obligation_id',
        'company_id',
        'user_id',
    ];

    // Relationships
    public function obligation(): BelongsTo
    {
        return $this->belongsTo(Obligation::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeForObligation($query, $obligationId)
    {
        return $query->where('obligation_id', $obligationId);
    }

    public function scopeForCompany($query, $companyId)
    {
        return $query->where('company_id', $companyId);
    }
}
