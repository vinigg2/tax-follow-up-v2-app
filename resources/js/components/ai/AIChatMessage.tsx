import { Bot, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIMessage } from '@/types/ai';

interface AIChatMessageProps {
  message: AIMessage;
}

export function AIChatMessage({ message }: AIChatMessageProps) {
  const isUser = message.role === 'user';
  const isAction = message.type === 'action';
  const isError = message.type === 'error';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
          isUser ? 'bg-primary' : 'bg-primary/10'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex flex-col max-w-[85%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : isError
                ? 'bg-destructive/10 text-destructive border border-destructive/20'
                : isAction
                  ? 'bg-green-500/10 text-green-700 border border-green-500/20'
                  : 'bg-muted'
          )}
        >
          {/* Action indicator */}
          {isAction && message.action && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-green-500/20">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Acao executada</span>
            </div>
          )}

          {/* Error indicator */}
          {isError && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-destructive/20">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">Erro</span>
            </div>
          )}

          {/* Message content */}
          <div className="whitespace-pre-wrap">{message.content}</div>

          {/* Action details */}
          {isAction && message.action && (
            <div className="mt-2 pt-2 border-t border-green-500/20 text-xs opacity-80">
              {message.action.type}: {message.action.description}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground mt-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
