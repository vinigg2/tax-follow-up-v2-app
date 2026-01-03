<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

class WeeklySummaryNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public array $weekStats,
        public Collection $nextWeekTasks,
        public Collection $overdueTasks
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('Resumo Semanal - Tax Follow Up')
            ->greeting('Ola, ' . $notifiable->name . '!')
            ->line('Aqui esta o resumo da sua semana:');

        // Week statistics
        $message->line('');
        $message->line('**Desempenho da Semana:**');
        $message->line('- Tarefas concluidas: ' . ($this->weekStats['completed'] ?? 0));
        $message->line('- Tarefas criadas: ' . ($this->weekStats['created'] ?? 0));
        $message->line('- Documentos aprovados: ' . ($this->weekStats['documents_approved'] ?? 0));

        // Overdue tasks
        if ($this->overdueTasks->isNotEmpty()) {
            $message->line('');
            $message->line('**Tarefas Atrasadas (' . $this->overdueTasks->count() . '):**');
            foreach ($this->overdueTasks->take(5) as $task) {
                $days = $task->deadline->diffInDays(now());
                $message->line('- ' . $task->title . ' (' . $days . ' dias de atraso)');
            }
            if ($this->overdueTasks->count() > 5) {
                $message->line('... e mais ' . ($this->overdueTasks->count() - 5) . ' tarefas');
            }
        }

        // Next week tasks
        if ($this->nextWeekTasks->isNotEmpty()) {
            $message->line('');
            $message->line('**Tarefas para Proxima Semana (' . $this->nextWeekTasks->count() . '):**');
            foreach ($this->nextWeekTasks->take(10) as $task) {
                $message->line('- ' . $task->title . ' (' . $task->deadline->format('d/m/Y') . ')');
            }
            if ($this->nextWeekTasks->count() > 10) {
                $message->line('... e mais ' . ($this->nextWeekTasks->count() - 10) . ' tarefas');
            }
        }

        return $message
            ->action('Ver Dashboard', config('app.frontend_url') . '/dashboard')
            ->line('Tenha uma otima semana!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'weekly_summary',
            'week_stats' => $this->weekStats,
            'next_week_count' => $this->nextWeekTasks->count(),
            'overdue_count' => $this->overdueTasks->count(),
        ];
    }
}
