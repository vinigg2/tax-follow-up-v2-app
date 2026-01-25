import { useQuery } from '@tanstack/react-query';
import {
  dashboardApi,
  DashboardOverviewResponse,
  DashboardTeamsResponse,
  DashboardCompaniesResponse,
  TeamStatusResponse,
  CompanyStatusResponse,
  PerformanceData,
  ChartDataResponse,
  RecentActivitiesResponse,
} from '@/api/dashboard';

export function useDashboardOverview() {
  return useQuery<DashboardOverviewResponse>({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => dashboardApi.getOverview(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useDashboardTeams() {
  return useQuery<DashboardTeamsResponse>({
    queryKey: ['dashboard', 'teams'],
    queryFn: () => dashboardApi.getTeams(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useDashboardCompanies() {
  return useQuery<DashboardCompaniesResponse>({
    queryKey: ['dashboard', 'companies'],
    queryFn: () => dashboardApi.getCompanies(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTeamStatus(teamId: number | string | undefined) {
  return useQuery<TeamStatusResponse>({
    queryKey: ['dashboard', 'team', teamId],
    queryFn: () => dashboardApi.getTeamStatus(teamId!),
    enabled: !!teamId,
  });
}

export function useCompanyStatus(companyId: number | string | undefined) {
  return useQuery<CompanyStatusResponse>({
    queryKey: ['dashboard', 'company', companyId],
    queryFn: () => dashboardApi.getCompanyStatus(companyId!),
    enabled: !!companyId,
  });
}

export function useDashboardPerformance(period: number = 30) {
  return useQuery<PerformanceData>({
    queryKey: ['dashboard', 'performance', period],
    queryFn: () => dashboardApi.getPerformance(period),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardChartData(type: 'monthly' | 'quarterly' | 'annually' = 'monthly') {
  return useQuery<ChartDataResponse>({
    queryKey: ['dashboard', 'chart-data', type],
    queryFn: () => dashboardApi.getChartData(type),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardRecentActivities(limit: number = 10) {
  return useQuery<RecentActivitiesResponse>({
    queryKey: ['dashboard', 'recent-activities', limit],
    queryFn: () => dashboardApi.getRecentActivities(limit),
    staleTime: 2 * 60 * 1000,
  });
}
