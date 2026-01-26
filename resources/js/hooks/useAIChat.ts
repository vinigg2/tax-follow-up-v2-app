import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { aiApi } from '@/api/ai';
import { AIMessage, AIAction, AIContext } from '@/types/ai';
import { useQueryClient } from '@tanstack/react-query';

interface UseAIChatReturn {
  messages: AIMessage[];
  isLoading: boolean;
  pendingAction: AIAction | null;
  conversationId: string | null;
  sendMessage: (message: string, context: AIContext) => Promise<void>;
  confirmAction: () => Promise<void>;
  cancelAction: () => void;
  clearMessages: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useAIChat(): UseAIChatReturn {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<AIAction | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const sendMessage = useCallback(
    async (message: string, context: AIContext) => {
      // Add user message
      const userMessage: AIMessage = {
        id: generateId(),
        role: 'user',
        content: message,
        type: 'text',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await aiApi.chat({
          message,
          context,
          conversationId: conversationId || undefined,
        });

        setConversationId(response.conversationId);

        // Check if there's an action that requires confirmation
        if (response.action?.requiresConfirmation) {
          setPendingAction(response.action);

          // Add assistant message indicating pending action
          const assistantMessage: AIMessage = {
            id: generateId(),
            role: 'assistant',
            content: response.message,
            type: 'text',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else if (response.action) {
          // Execute action directly
          await executeAction(response.action);

          // Add success message
          const actionMessage: AIMessage = {
            id: generateId(),
            role: 'assistant',
            content: response.message,
            type: 'action',
            action: response.action,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, actionMessage]);
        } else {
          // Just a text response
          const assistantMessage: AIMessage = {
            id: generateId(),
            role: 'assistant',
            content: response.message,
            type: 'text',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (error) {
        const errorMessage: AIMessage = {
          id: generateId(),
          role: 'assistant',
          content:
            error instanceof Error
              ? error.message
              : 'Desculpe, ocorreu um erro ao processar sua mensagem.',
          type: 'error',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  const executeAction = useCallback(
    async (action: AIAction) => {
      switch (action.type) {
        case 'navigate':
          if (action.data?.path) {
            navigate(action.data.path as string);
          }
          break;

        case 'create_task':
          await aiApi.executeAction(action);
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          toast.success('Tarefa criada com sucesso!');
          break;

        case 'update_task':
          await aiApi.executeAction(action);
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          toast.success('Tarefa atualizada!');
          break;

        case 'create_obligation':
          await aiApi.executeAction(action);
          queryClient.invalidateQueries({ queryKey: ['obligations'] });
          toast.success('Obrigacao criada com sucesso!');
          break;

        case 'change_status':
          await aiApi.executeAction(action);
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          toast.success('Status alterado!');
          break;

        case 'assign_responsible':
          await aiApi.executeAction(action);
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          toast.success('Responsavel atribuido!');
          break;

        case 'create_checklist':
          await aiApi.executeAction(action);
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          toast.success('Checklist criado!');
          break;

        default:
          console.log('Unknown action type:', action.type);
      }
    },
    [navigate, queryClient]
  );

  const confirmAction = useCallback(async () => {
    if (!pendingAction) return;

    setIsLoading(true);
    try {
      await executeAction(pendingAction);

      const actionMessage: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'Acao executada com sucesso!',
        type: 'action',
        action: pendingAction,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, actionMessage]);
    } catch (error) {
      const errorMessage: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content:
          error instanceof Error
            ? error.message
            : 'Erro ao executar a acao.',
        type: 'error',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setPendingAction(null);
      setIsLoading(false);
    }
  }, [pendingAction, executeAction]);

  const cancelAction = useCallback(() => {
    setPendingAction(null);
    const cancelMessage: AIMessage = {
      id: generateId(),
      role: 'assistant',
      content: 'Acao cancelada. Como posso ajudar?',
      type: 'text',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, cancelMessage]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setPendingAction(null);
  }, []);

  return {
    messages,
    isLoading,
    pendingAction,
    conversationId,
    sendMessage,
    confirmAction,
    cancelAction,
    clearMessages,
  };
}
