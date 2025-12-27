import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  teamsApi,
  Team,
  TeamsResponse,
  TeamResponse,
  TeamFormData,
  User,
  Company,
} from '@/api/teams';

export function useTeams() {
  return useQuery<TeamsResponse>({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeam(id: number | string | undefined) {
  return useQuery<TeamResponse>({
    queryKey: ['team', id],
    queryFn: () => teamsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TeamFormData) => teamsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: TeamFormData }) =>
      teamsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', id] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => teamsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

// Members hooks
export function useTeamMembers(teamId: number | string | undefined) {
  return useQuery<{ members: User[] }>({
    queryKey: ['team-members', teamId],
    queryFn: () => teamsApi.getMembers(teamId!),
    enabled: !!teamId,
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number | string; userId: number }) =>
      teamsApi.addMember(teamId, userId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number | string; userId: number }) =>
      teamsApi.removeMember(teamId, userId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
    },
  });
}

// Companies hooks
export function useTeamCompanies(teamId: number | string | undefined) {
  return useQuery<{ companies: Company[] }>({
    queryKey: ['team-companies', teamId],
    queryFn: () => teamsApi.getCompanies(teamId!),
    enabled: !!teamId,
  });
}

export function useLinkCompanyToTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, companyId }: { teamId: number | string; companyId: number }) =>
      teamsApi.linkCompany(teamId, companyId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-companies', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['available-companies'] });
    },
  });
}

export function useUnlinkCompanyFromTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, companyId }: { teamId: number | string; companyId: number }) =>
      teamsApi.unlinkCompany(teamId, companyId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-companies', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['available-companies'] });
    },
  });
}

// Available resources hooks
export function useAvailableUsers() {
  return useQuery<{ users: User[] }>({
    queryKey: ['available-users'],
    queryFn: () => teamsApi.getAvailableUsers(),
  });
}

export function useAvailableCompanies() {
  return useQuery<{ companies: Company[] }>({
    queryKey: ['available-companies'],
    queryFn: () => teamsApi.getAvailableCompanies(),
  });
}
