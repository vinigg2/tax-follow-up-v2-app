<?php

namespace App\Notifications;

use App\Infrastructure\Persistence\Models\TaskFile;
use App\Infrastructure\Persistence\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DocumentStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public TaskFile $document,
        public string $status, // approved, rejected
        public ?User $reviewedBy = null,
        public ?string $reason = null
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $isApproved = $this->status === 'approved';
        $subject = $isApproved
            ? 'Documento Aprovado: ' . $this->document->name
            : 'Documento Rejeitado: ' . $this->document->name;

        $message = (new MailMessage)
            ->subject($subject)
            ->greeting('Ola, ' . $notifiable->name . '!')
            ->line($isApproved
                ? 'Seu documento foi aprovado.'
                : 'Seu documento foi rejeitado.')
            ->line('**Documento:** ' . $this->document->name)
            ->line('**Tarefa:** ' . $this->document->task?->title)
            ->line('**Revisado por:** ' . ($this->reviewedBy?->name ?? 'Sistema'));

        if (!$isApproved && $this->reason) {
            $message->line('**Motivo:** ' . $this->reason);
        }

        return $message
            ->action('Ver Documento', config('app.frontend_url') . '/tasks/' . $this->document->task_id)
            ->line('Obrigado por usar o Tax Follow Up!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'document_status',
            'status' => $this->status,
            'document_id' => $this->document->id,
            'document_name' => $this->document->name,
            'task_id' => $this->document->task_id,
            'task_title' => $this->document->task?->title,
            'reviewed_by_id' => $this->reviewedBy?->id,
            'reviewed_by_name' => $this->reviewedBy?->name ?? 'Sistema',
            'reason' => $this->reason,
            'message' => $this->status === 'approved'
                ? 'Documento aprovado: ' . $this->document->name
                : 'Documento rejeitado: ' . $this->document->name,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'type' => 'document_status',
            'status' => $this->status,
            'document_id' => $this->document->id,
            'document_name' => $this->document->name,
            'task_id' => $this->document->task_id,
            'message' => $this->status === 'approved'
                ? 'Documento aprovado: ' . $this->document->name
                : 'Documento rejeitado: ' . $this->document->name,
        ]);
    }
}
