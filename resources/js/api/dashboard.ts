import api from './axios';

export interface DashboardStats {
  total_tasks?: number;
  delayed_tasks?: number;
  completed_this_month?: number;
  by_status?: {
    new?: number;
    pending?: number;
    late?: number;
    finished?: number;
    rectified?: number;
  };
  upcoming_deadlines?: UpcomingDeadline[];
}

export interface UpcomingDeadline {
  id: number;
  title: string;
  company: string;
  deadline: string;
  days_until: number;
}

export interface Team {
  id: number;
  name: string;
  health_score: number;
  total_tasks?: number;
  delayed_tasks?: number;
}

export interface Company {
  id: number;
  name: string;
  health_score?: number;
  total_tasks?: number;
  delayed_tasks?: number;
  pending_tasks?: number;
}

export interface DashboardOverviewResponse {
  stats: DashboardStats;
}

export interface DashboardTeamsResponse {
  teams: Team[];
}

export interface DashboardCompaniesResponse {
  companies: Company[];
}

export interface TeamStatusResponse {
  team: Team;
  tasks?: {
    total: number;
    completed: number;
    pending: number;
    delayed: number;
  };
}

export interface CompanyStatusResponse {
  company: Company;
  tasks?: {
    total: number;
    completed: number;
    pending: number;
    delayed: number;
  };
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  type: string;
}

export interface CalendarResponse {
  events: CalendarEvent[];
}

export interface PerformanceData {
  period: string;
  data: {
    name: string;
    concluidas: number;
    pendentes: number;
    atrasadas: number;
  }[];
}

export const dashboardApi = {
  getOverview: async (): Promise<DashboardOverviewResponse> => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },

  getTeams: async (): Promise<DashboardTeamsResponse> => {
    const response = await api.get('/dashboard/teams');
    return response.data;
  },

  getTeamStatus: async (teamId: number | string): Promise<TeamStatusResponse> => {
    const response = await api.get(`/dashboard/teams/${teamId}/status`);
    return response.data;
  },

  getCompanies: async (): Promise<DashboardCompaniesResponse> => {
    const response = await api.get('/dashboard/companies');
    return response.data;
  },

  getCompanyStatus: async (
    companyId: number | string
  ): Promise<CompanyStatusResponse> => {
    const response = await api.get(`/dashboard/companies/${companyId}/status`);
    return response.data;
  },

  getCalendar: async (
    params: Record<string, unknown> = {}
  ): Promise<CalendarResponse> => {
    const response = await api.get('/dashboard/calendar', { params });
    return response.data;
  },

  getPerformance: async (period: number = 30): Promise<PerformanceData> => {
    const response = await api.get('/dashboard/performance', {
      params: { period },
    });
    return response.data;
  },
};
