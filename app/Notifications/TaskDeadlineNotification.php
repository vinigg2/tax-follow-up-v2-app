<?php

namespace App\Notifications;

use App\Infrastructure\Persistence\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskDeadlineNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Task $task,
        public string $urgency = 'warning' // warning, urgent, overdue
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database', 'broadcast'];

        if ($notifiable->daily_notifications) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $subject = match($this->urgency) {
            'overdue' => 'Tarefa Atrasada: ' . $this->task->title,
            'urgent' => 'Tarefa Urgente: ' . $this->task->title,
            default => 'Lembrete de Prazo: ' . $this->task->title,
        };

        $message = match($this->urgency) {
            'overdue' => 'A tarefa esta atrasada e precisa de atencao imediata.',
            'urgent' => 'A tarefa vence em breve. Por favor, verifique.',
            default => 'Lembrete sobre o prazo da tarefa.',
        };

        return (new MailMessage)
            ->subject($subject)
            ->greeting('Ola, ' . $notifiable->name . '!')
            ->line($message)
            ->line('**Tarefa:** ' . $this->task->title)
            ->line('**Prazo:** ' . $this->task->deadline->format('d/m/Y'))
            ->line('**Empresa:** ' . ($this->task->company?->name ?? 'N/A'))
            ->action('Ver Tarefa', config('app.frontend_url') . '/tasks/' . $this->task->id)
            ->line('Obrigado por usar o Tax Follow Up!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'task_deadline',
            'urgency' => $this->urgency,
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'deadline' => $this->task->deadline->toISOString(),
            'company_name' => $this->task->company?->name,
            'message' => $this->getMessage(),
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'type' => 'task_deadline',
            'urgency' => $this->urgency,
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'deadline' => $this->task->deadline->toISOString(),
            'message' => $this->getMessage(),
        ]);
    }

    private function getMessage(): string
    {
        return match($this->urgency) {
            'overdue' => 'A tarefa "' . $this->task->title . '" esta atrasada',
            'urgent' => 'A tarefa "' . $this->task->title . '" vence em breve',
            default => 'Lembrete: "' . $this->task->title . '" vence em ' . $this->task->deadline->format('d/m/Y'),
        };
    }
}
