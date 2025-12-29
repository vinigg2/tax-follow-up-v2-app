import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  tasksApi,
  Task,
  TasksResponse,
  TaskResponse,
  TimelineResponse,
  TaskUpdateData,
  TaskCreateData,
  TimelineEntryData,
} from '@/api/tasks';

export function useTasks(
  method: string = 'currentIteration',
  params: Record<string, unknown> = {}
) {
  return useQuery<TasksResponse>({
    queryKey: ['tasks', method, params],
    queryFn: () => tasksApi.getByMethod(method, params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTask(id: number | string | undefined) {
  return useQuery<TaskResponse>({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(id!),
    enabled: !!id,
  });
}

export function useTaskTimeline(taskId: number | string | undefined) {
  return useQuery<TimelineResponse>({
    queryKey: ['task-timeline', taskId],
    queryFn: () => tasksApi.getTimeline(taskId!),
    enabled: !!taskId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskCreateData) => tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: TaskUpdateData }) =>
      tasksApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', id] });
    },
  });
}

export function useCorrectTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, deadline }: { id: number | string; deadline: string }) =>
      tasksApi.correct(id, deadline),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useArchiveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => tasksApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useAddTimelineEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: number | string;
      data: TimelineEntryData;
    }) => tasksApi.addTimelineEntry(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['task-timeline', taskId] });
    },
  });
}
