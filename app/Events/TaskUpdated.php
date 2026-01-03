<?php

namespace App\Events;

use App\Infrastructure\Persistence\Models\Task;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Task $task,
        public string $action = 'updated',
        public ?int $updatedBy = null
    ) {}

    public function broadcastOn(): array
    {
        $channels = [];

        // Broadcast to the responsible user
        if ($this->task->responsible) {
            $channels[] = new PrivateChannel('user.' . $this->task->responsible);
        }

        // Broadcast to the group channel
        if ($this->task->group_id) {
            $channels[] = new PrivateChannel('group.' . $this->task->group_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'task.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'task_id' => $this->task->id,
            'title' => $this->task->title,
            'status' => $this->task->status,
            'progress' => $this->task->progress,
            'deadline' => $this->task->deadline?->toISOString(),
            'action' => $this->action,
            'updated_by' => $this->updatedBy,
            'updated_at' => now()->toISOString(),
        ];
    }
}
