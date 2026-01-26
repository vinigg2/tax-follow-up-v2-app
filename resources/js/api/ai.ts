import api from './axios';
import { AIChatRequest, AIChatResponse, AIAction } from '@/types/ai';

export const aiApi = {
  /**
   * Send a chat message to the AI
   */
  chat: async (request: AIChatRequest): Promise<AIChatResponse> => {
    const response = await api.post('/ai/chat', request);
    return response.data;
  },

  /**
   * Execute an AI action (after confirmation)
   */
  executeAction: async (action: AIAction): Promise<void> => {
    await api.post('/ai/execute', { action });
  },

  /**
   * Analyze a document with AI
   */
  analyzeDocument: async (
    documentId: number,
    prompt?: string
  ): Promise<{ analysis: string }> => {
    const response = await api.post(`/ai/analyze-document/${documentId}`, {
      prompt,
    });
    return response.data;
  },

  /**
   * Get AI suggestions for a task
   */
  getTaskSuggestions: async (
    taskId: number
  ): Promise<{ suggestions: string[] }> => {
    const response = await api.get(`/ai/suggestions/task/${taskId}`);
    return response.data;
  },

  /**
   * Generate obligation from description
   */
  generateObligation: async (
    description: string
  ): Promise<{
    title: string;
    frequency: string;
    dayDeadline: number;
    period: number;
  }> => {
    const response = await api.post('/ai/generate-obligation', {
      description,
    });
    return response.data;
  },
};
