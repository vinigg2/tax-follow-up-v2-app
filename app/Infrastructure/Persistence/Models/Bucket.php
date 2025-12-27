<?php

namespace App\Infrastructure\Persistence\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bucket extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'group_id',
    ];

    // Relationships
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    // Helper methods
    public static function getOrCreateForGroup(Group $group): self
    {
        return self::firstOrCreate(
            ['group_id' => $group->id],
            ['name' => 'tfu-group-' . $group->id . '-' . time()]
        );
    }

    public function getDocumentPath(Document $document): string
    {
        return sprintf(
            '%s/%s/%s',
            $document->company_id,
            $document->task_id,
            $document->id
        );
    }
}
