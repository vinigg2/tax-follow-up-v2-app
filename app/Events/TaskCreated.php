<?php

namespace App\Events;

use App\Infrastructure\Persistence\Models\Task;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Task $task,
        public ?int $createdBy = null
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
        return 'task.created';
    }

    public function broadcastWith(): array
    {
        return [
            'task_id' => $this->task->id,
            'title' => $this->task->title,
            'status' => $this->task->status,
            'deadline' => $this->task->deadline?->toISOString(),
            'company_id' => $this->task->company_id,
            'company_name' => $this->task->company?->name,
            'responsible' => $this->task->responsible,
            'created_by' => $this->createdBy,
            'created_at' => $this->task->created_at->toISOString(),
        ];
    }
}
