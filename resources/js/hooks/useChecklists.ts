import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  checklistsApi,
  ChecklistItem,
  ChecklistsResponse,
  ChecklistResponse,
  ChecklistFormData,
  ChecklistStatus,
} from '@/api/checklists';

export function useTaskChecklists(taskId: number | string | undefined) {
  return useQuery<ChecklistsResponse>({
    queryKey: ['task-checklists', taskId],
    queryFn: () => checklistsApi.getByTask(taskId!),
    enabled: !!taskId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number | string; data: ChecklistFormData }) =>
      checklistsApi.create(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklists', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<ChecklistFormData> }) =>
      checklistsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklists'] });
    },
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => checklistsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklists'] });
    },
  });
}

export function useUpdateChecklistStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: ChecklistStatus }) =>
      checklistsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklists'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
}

export function useReorderChecklists() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, itemIds }: { taskId: number | string; itemIds: number[] }) =>
      checklistsApi.reorder(taskId, itemIds),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklists', taskId] });
    },
  });
}
