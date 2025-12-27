import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  X,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

type NotificationType = 'task_due' | 'task_late' | 'task_completed' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

const NOTIFICATION_CONFIG: Record<
  NotificationType,
  { icon: typeof Bell; color: string; bg: string }
> = {
  task_due: {
    icon: Clock,
    color: 'text-warning-600 dark:text-warning-400',
    bg: 'bg-warning-100 dark:bg-warning-900/30',
  },
  task_late: {
    icon: AlertTriangle,
    color: 'text-error-600 dark:text-error-400',
    bg: 'bg-error-100 dark:bg-error-900/30',
  },
  task_completed: {
    icon: CheckCircle,
    color: 'text-success-600 dark:text-success-400',
    bg: 'bg-success-100 dark:bg-success-900/30',
  },
  system: {
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
};

// Mock notifications - replace with real API data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'task_late',
    title: 'Tarefa atrasada',
    message: 'DCTF Mensal - Empresa ABC esta atrasada',
    time: 'Ha 2 horas',
    read: false,
    link: '/tasks/1',
  },
  {
    id: '2',
    type: 'task_due',
    title: 'Prazo proximo',
    message: 'EFD-Contribuicoes vence em 2 dias',
    time: 'Ha 4 horas',
    read: false,
    link: '/tasks/2',
  },
  {
    id: '3',
    type: 'task_completed',
    title: 'Tarefa concluida',
    message: 'SPED Fiscal foi finalizada por Joao Silva',
    time: 'Ontem',
    read: true,
    link: '/tasks/3',
  },
  {
    id: '4',
    type: 'system',
    title: 'Nova obrigacao',
    message: 'DIRF 2024 foi adicionada automaticamente',
    time: 'Ha 2 dias',
    read: true,
    link: '/tasks/4',
  },
];

export function NotificationsDropdown() {
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          mode="icon"
          shape="circle"
          className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary relative"
        >
          <Bell className="size-4.5!" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-error-500 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align="end"
        sideOffset={11}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Notificacoes
            </h3>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-white bg-error-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              <CheckCheck className="size-3.5 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                <Bell className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Nenhuma notificacao
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Voce esta em dia com tudo!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const config = NOTIFICATION_CONFIG[notification.type];
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'relative group px-4 py-3 hover:bg-muted/50 transition-colors',
                      !notification.read && 'bg-primary/5'
                    )}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div
                        className={cn(
                          'flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg',
                          config.bg
                        )}
                      >
                        <Icon className={cn('size-4', config.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p
                              className={cn(
                                'text-sm',
                                notification.read
                                  ? 'text-foreground'
                                  : 'text-foreground font-medium'
                              )}
                            >
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground/70 mt-1">
                              {notification.time}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                title="Marcar como lida"
                              >
                                <CheckCircle className="size-3.5 text-muted-foreground" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              title="Remover"
                            >
                              <X className="size-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>

                        {/* Link */}
                        {notification.link && (
                          <Link
                            to={notification.link}
                            className="text-xs text-primary hover:underline mt-1 inline-block"
                            onClick={() => {
                              markAsRead(notification.id);
                              setIsOpen(false);
                            }}
                          >
                            Ver detalhes
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t border-border">
            <Link
              to="/notifications"
              className="block text-center text-sm text-primary hover:underline"
              onClick={() => setIsOpen(false)}
            >
              Ver todas as notificacoes
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
