import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { AIContext as AIContextType } from '@/types/ai';
import { useAuth } from '@/hooks/useAuth';

interface AIContextValue {
  context: AIContextType;
  setTaskContext: (task: AIContextType['task']) => void;
  setCompanyContext: (company: AIContextType['company']) => void;
  setObligationContext: (obligation: AIContextType['obligation']) => void;
  clearContext: () => void;
}

const AIContext = createContext<AIContextValue | null>(null);

interface AIProviderProps {
  children: ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  const location = useLocation();
  const { user, groups } = useAuth();

  const [taskContext, setTaskContext] = useState<AIContextType['task']>();
  const [companyContext, setCompanyContext] = useState<AIContextType['company']>();
  const [obligationContext, setObligationContext] = useState<AIContextType['obligation']>();

  // Determine current page from route
  const getPageName = useCallback((): string | null => {
    const path = location.pathname;

    if (path === '/dashboard') return 'Dashboard';
    if (path === '/tasks') return 'Lista de Tarefas';
    if (path.startsWith('/tasks/')) return 'Detalhes da Tarefa';
    if (path === '/obligations') return 'Obrigacoes';
    if (path === '/companies') return 'Empresas';
    if (path === '/users') return 'Usuarios';
    if (path === '/teams') return 'Times';
    if (path === '/approvals') return 'Aprovacoes';

    return null;
  }, [location.pathname]);

  // Get selected group from localStorage or first group
  const getSelectedGroup = useCallback((): AIContextType['selectedGroup'] => {
    if (groups.length === 0) return undefined;

    const storedGroupId = localStorage.getItem('selectedGroupId');
    const group = storedGroupId
      ? groups.find((g) => g.id === parseInt(storedGroupId))
      : groups[0];

    return group ? { id: group.id, name: group.name } : undefined;
  }, [groups]);

  const clearContext = useCallback(() => {
    setTaskContext(undefined);
    setCompanyContext(undefined);
    setObligationContext(undefined);
  }, []);

  const context: AIContextType = {
    page: getPageName(),
    task: taskContext,
    company: companyContext,
    obligation: obligationContext,
    selectedGroup: getSelectedGroup(),
    user: user
      ? {
          id: user.id,
          name: user.name,
          role: 'user', // Will be enhanced later
        }
      : undefined,
  };

  return (
    <AIContext.Provider
      value={{
        context,
        setTaskContext,
        setCompanyContext,
        setObligationContext,
        clearContext,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAIContext(): AIContextValue {
  const context = useContext(AIContext);

  if (!context) {
    throw new Error('useAIContext must be used within an AIProvider');
  }

  return context;
}
