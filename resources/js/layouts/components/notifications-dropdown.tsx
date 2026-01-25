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
  Upload,
  FileCheck,
  FileX,
  ClipboardCheck,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import { NotificationType } from '@/api/notifications';

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
  document_uploaded: {
    icon: Upload,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  document_approved: {
    icon: FileCheck,
    color: 'text-success-600 dark:text-success-400',
    bg: 'bg-success-100 dark:bg-success-900/30',
  },
  document_rejected: {
    icon: FileX,
    color: 'text-error-600 dark:text-error-400',
    bg: 'bg-error-100 dark:bg-error-900/30',
  },
  approval_pending: {
    icon: ClipboardCheck,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  system: {
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
};

function formatNotificationTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch {
    return dateString;
  }
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: notificationsData, isLoading } = useNotifications(1, 10);
  const { data: unreadData } = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const notifications = notificationsData?.data ?? [];
  const unreadCount = unreadData?.count ?? 0;

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleRemoveNotification = (id: string) => {
    deleteNotificationMutation.mutate(id);
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
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="size-3.5 mr-1 animate-spin" />
              ) : (
                <CheckCheck className="size-3.5 mr-1" />
              )}
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
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
                const notificationType = notification.data.type as NotificationType;
                const config = NOTIFICATION_CONFIG[notificationType] ?? NOTIFICATION_CONFIG.system;
                const Icon = config.icon;
                const isRead = !!notification.read_at;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'relative group px-4 py-3 hover:bg-muted/50 transition-colors',
                      !isRead && 'bg-primary/5'
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
                                isRead
                                  ? 'text-foreground'
                                  : 'text-foreground font-medium'
                              )}
                            >
                              {notification.data.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.data.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground/70 mt-1">
                              {formatNotificationTime(notification.created_at)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                title="Marcar como lida"
                                disabled={markAsReadMutation.isPending}
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
                                handleRemoveNotification(notification.id);
                              }}
                              title="Remover"
                              disabled={deleteNotificationMutation.isPending}
                            >
                              <X className="size-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>

                        {/* Link */}
                        {notification.data.link && (
                          <Link
                            to={notification.data.link}
                            className="text-xs text-primary hover:underline mt-1 inline-block"
                            onClick={() => {
                              if (!isRead) {
                                handleMarkAsRead(notification.id);
                              }
                              setIsOpen(false);
                            }}
                          >
                            Ver detalhes
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!isRead && (
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
