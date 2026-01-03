<?php

namespace App\Events;

use App\Infrastructure\Persistence\Models\TaskFile;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DocumentStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public TaskFile $document,
        public string $status,
        public ?int $reviewedBy = null,
        public ?string $reason = null
    ) {}

    public function broadcastOn(): array
    {
        $channels = [];

        // Broadcast to the task owner
        if ($this->document->task?->responsible) {
            $channels[] = new PrivateChannel('user.' . $this->document->task->responsible);
        }

        // Broadcast to the document uploader
        if ($this->document->user_id && $this->document->user_id !== $this->document->task?->responsible) {
            $channels[] = new PrivateChannel('user.' . $this->document->user_id);
        }

        // Broadcast to the group channel
        if ($this->document->task?->group_id) {
            $channels[] = new PrivateChannel('group.' . $this->document->task->group_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'document.status_changed';
    }

    public function broadcastWith(): array
    {
        return [
            'document_id' => $this->document->id,
            'document_name' => $this->document->name,
            'task_id' => $this->document->task_id,
            'task_title' => $this->document->task?->title,
            'status' => $this->status,
            'reviewed_by' => $this->reviewedBy,
            'reason' => $this->reason,
            'updated_at' => now()->toISOString(),
        ];
    }
}
