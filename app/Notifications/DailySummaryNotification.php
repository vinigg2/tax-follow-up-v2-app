<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

class DailySummaryNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Collection $overdueTasks,
        public Collection $dueTodayTasks,
        public Collection $upcomingTasks,
        public array $stats = []
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('Resumo Diario - Tax Follow Up')
            ->greeting('Bom dia, ' . $notifiable->name . '!')
            ->line('Aqui esta o resumo das suas tarefas para hoje:');

        // Overdue tasks
        if ($this->overdueTasks->isNotEmpty()) {
            $message->line('');
            $message->line('**Tarefas Atrasadas (' . $this->overdueTasks->count() . '):**');
            foreach ($this->overdueTasks->take(5) as $task) {
                $message->line('- ' . $task->title . ' (venceu em ' . $task->deadline->format('d/m/Y') . ')');
            }
            if ($this->overdueTasks->count() > 5) {
                $message->line('... e mais ' . ($this->overdueTasks->count() - 5) . ' tarefas');
            }
        }

        // Due today
        if ($this->dueTodayTasks->isNotEmpty()) {
            $message->line('');
            $message->line('**Vencem Hoje (' . $this->dueTodayTasks->count() . '):**');
            foreach ($this->dueTodayTasks->take(5) as $task) {
                $message->line('- ' . $task->title);
            }
            if ($this->dueTodayTasks->count() > 5) {
                $message->line('... e mais ' . ($this->dueTodayTasks->count() - 5) . ' tarefas');
            }
        }

        // Upcoming tasks
        if ($this->upcomingTasks->isNotEmpty()) {
            $message->line('');
            $message->line('**Proximos 7 Dias (' . $this->upcomingTasks->count() . '):**');
            foreach ($this->upcomingTasks->take(5) as $task) {
                $message->line('- ' . $task->title . ' (' . $task->deadline->format('d/m/Y') . ')');
            }
            if ($this->upcomingTasks->count() > 5) {
                $message->line('... e mais ' . ($this->upcomingTasks->count() - 5) . ' tarefas');
            }
        }

        // Stats
        if (!empty($this->stats)) {
            $message->line('');
            $message->line('**Estatisticas:**');
            $message->line('- Total de tarefas: ' . ($this->stats['total'] ?? 0));
            $message->line('- Concluidas: ' . ($this->stats['completed'] ?? 0));
            $message->line('- Em andamento: ' . ($this->stats['in_progress'] ?? 0));
        }

        return $message
            ->action('Ver Todas as Tarefas', config('app.frontend_url') . '/tasks')
            ->line('Tenha um otimo dia de trabalho!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'daily_summary',
            'overdue_count' => $this->overdueTasks->count(),
            'due_today_count' => $this->dueTodayTasks->count(),
            'upcoming_count' => $this->upcomingTasks->count(),
            'stats' => $this->stats,
        ];
    }
}
