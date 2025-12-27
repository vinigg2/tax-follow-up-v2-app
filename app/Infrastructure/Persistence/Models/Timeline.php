<?php

namespace App\Infrastructure\Persistence\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Timeline extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'task_id',
        'user_id',
        'user_name',
        'document_id',
        'description',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    // Relationships
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    // Scopes
    public function scopeForTask($query, $taskId)
    {
        return $query->where('task_id', $taskId);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Factory method
    public static function createEntry(
        string $type,
        ?int $taskId,
        ?int $userId,
        ?string $description = null,
        ?int $documentId = null,
        ?array $metadata = null
    ): self {
        $user = $userId ? User::find($userId) : null;

        return self::create([
            'type' => $type,
            'task_id' => $taskId,
            'user_id' => $userId,
            'user_name' => $user?->name,
            'document_id' => $documentId,
            'description' => $description,
            'metadata' => $metadata,
        ]);
    }

    // Helper methods
    public function getTypeLabel(): string
    {
        $types = config('taxfollowup.timeline_types');
        $labels = [
            'started' => 'Iniciado',
            'finished' => 'Finalizado',
            'send_file' => 'Arquivo enviado',
            'request_approval' => 'Aprovacao solicitada',
            'approved' => 'Aprovado',
            'rejected' => 'Rejeitado',
            'reset_document' => 'Documento resetado',
            'correct_task' => 'Tarefa retificada',
            'archived_task' => 'Tarefa arquivada',
            'unarchived_task' => 'Tarefa desarquivada',
            'changed_title' => 'Titulo alterado',
            'changed_description' => 'Descricao alterada',
            'changed_deadline' => 'Prazo alterado',
            'changed_responsible' => 'Responsavel alterado',
            'free_text' => 'Comentario',
        ];

        return $labels[$this->type] ?? $this->type;
    }
}
