// AI Message types
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'action' | 'error';
  action?: AIAction;
  timestamp: Date;
}

// AI Action types
export type AIActionType =
  | 'create_task'
  | 'update_task'
  | 'create_obligation'
  | 'update_obligation'
  | 'analyze_document'
  | 'assign_responsible'
  | 'change_status'
  | 'create_checklist'
  | 'navigate';

export interface AIAction {
  type: AIActionType;
  description: string;
  data?: Record<string, unknown>;
  requiresConfirmation: boolean;
}

// AI Context - what the AI knows about the current page
export interface AIContext {
  page: string | null;
  task?: {
    id: number;
    title: string;
    status: string;
    company: string;
    deadline: string;
    responsible?: string;
    documents?: Array<{
      id: number;
      name: string;
      status: string;
    }>;
    checklists?: Array<{
      id: number;
      title: string;
      completed: boolean;
    }>;
  };
  company?: {
    id: number;
    name: string;
    cnpj?: string;
  };
  obligation?: {
    id: number;
    title: string;
    frequency: string;
  };
  selectedGroup?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
    role: string;
  };
}

// API Request/Response types
export interface AIChatRequest {
  message: string;
  context: AIContext;
  conversationId?: string;
}

export interface AIChatResponse {
  message: string;
  action?: AIAction;
  conversationId: string;
}

// Tool definitions (for backend)
export interface AITool {
  name: AIActionType;
  description: string;
  parameters: Record<string, unknown>;
}
