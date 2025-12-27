import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  obligationsApi,
  Obligation,
  ObligationsResponse,
  ObligationResponse,
  ObligationFormData,
  ObligationPreviewData,
  GenerateTasksData,
  ObligationKind,
  ObligationFrequency,
} from '@/api/obligations';

export function useObligations(params?: { kind?: ObligationKind; frequency?: ObligationFrequency }) {
  return useQuery<ObligationsResponse>({
    queryKey: ['obligations', params],
    queryFn: () => obligationsApi.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useObligation(id: number | string | undefined) {
  return useQuery<ObligationResponse>({
    queryKey: ['obligation', id],
    queryFn: () => obligationsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateObligation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ObligationFormData) => obligationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
    },
  });
}

export function useUpdateObligation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<ObligationFormData> }) =>
      obligationsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
      queryClient.invalidateQueries({ queryKey: ['obligation', id] });
    },
  });
}

export function useDeleteObligation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => obligationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
    },
  });
}

export function useObligationPreview() {
  return useMutation<ObligationPreviewData, Error, Partial<ObligationFormData>>({
    mutationFn: (data) => obligationsApi.preview(data),
  });
}

export function useGenerateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data?: GenerateTasksData }) =>
      obligationsApi.generateTasks(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
    },
  });
}

export function useObligationCompanies(id: number | string | undefined) {
  return useQuery({
    queryKey: ['obligation-companies', id],
    queryFn: () => obligationsApi.getCompanies(id!),
    enabled: !!id,
  });
}

export function useAssignObligationCompanies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, company_ids }: { id: number | string; company_ids: number[] }) =>
      obligationsApi.assignCompanies(id, company_ids),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['obligation-companies', id] });
      queryClient.invalidateQueries({ queryKey: ['obligation', id] });
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
    },
  });
}
