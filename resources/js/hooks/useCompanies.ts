import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  companiesApi,
  Company,
  CompaniesResponse,
  CompanyResponse,
  CompanyFormData,
} from '@/api/companies';

export function useCompanies(params?: { team_id?: number }) {
  return useQuery<CompaniesResponse>({
    queryKey: ['companies', params],
    queryFn: () => companiesApi.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompany(id: number | string | undefined) {
  return useQuery<CompanyResponse>({
    queryKey: ['company', id],
    queryFn: () => companiesApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompanyFormData) => companiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['available-companies'] });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: CompanyFormData }) =>
      companiesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => companiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['available-companies'] });
    },
  });
}
