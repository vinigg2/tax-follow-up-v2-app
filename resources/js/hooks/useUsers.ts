import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  usersApi,
  User,
  UsersResponse,
  UserResponse,
  UserFormData,
} from '@/api/users';

export function useUsers(params?: { team_id?: number }) {
  return useQuery<UsersResponse>({
    queryKey: ['users', params],
    queryFn: () => usersApi.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUser(id: number | string | undefined) {
  return useQuery<UserResponse>({
    queryKey: ['user', id],
    queryFn: () => usersApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserFormData) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<UserFormData> }) =>
      usersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
    },
  });
}

export function useToggleUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => usersApi.toggleActive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: { password: string; password_confirmation: string } }) =>
      usersApi.resetPassword(id, data),
  });
}
