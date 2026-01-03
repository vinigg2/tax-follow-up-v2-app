<?php

namespace App\Notifications;

use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Task $task,
        public ?User $assignedBy = null
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $assignedByName = $this->assignedBy?->name ?? 'Sistema';

        return (new MailMessage)
            ->subject('Nova Tarefa Atribuida: ' . $this->task->title)
            ->greeting('Ola, ' . $notifiable->name . '!')
            ->line('Uma nova tarefa foi atribuida a voce por ' . $assignedByName . '.')
            ->line('**Tarefa:** ' . $this->task->title)
            ->line('**Prazo:** ' . $this->task->deadline->format('d/m/Y'))
            ->line('**Empresa:** ' . ($this->task->company?->name ?? 'N/A'))
            ->line('**Prioridade:** ' . ucfirst($this->task->priority ?? 'normal'))
            ->action('Ver Tarefa', config('app.frontend_url') . '/tasks/' . $this->task->id)
            ->line('Obrigado por usar o Tax Follow Up!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'task_assigned',
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'deadline' => $this->task->deadline->toISOString(),
            'company_name' => $this->task->company?->name,
            'assigned_by_id' => $this->assignedBy?->id,
            'assigned_by_name' => $this->assignedBy?->name ?? 'Sistema',
            'message' => 'Nova tarefa atribuida: ' . $this->task->title,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'type' => 'task_assigned',
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'deadline' => $this->task->deadline->toISOString(),
            'assigned_by_name' => $this->assignedBy?->name ?? 'Sistema',
            'message' => 'Nova tarefa atribuida: ' . $this->task->title,
        ]);
    }
}
