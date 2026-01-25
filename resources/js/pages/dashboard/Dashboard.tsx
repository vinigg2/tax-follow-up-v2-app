import {
  useDashboardOverview,
  useDashboardTeams,
  useDashboardCompanies,
} from '@/hooks/useDashboard';
import StockCard from '@/components/dashboard/StockCard';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import TrendingTasks from '@/components/dashboard/TrendingTasks';
import WatchlistCarousel from '@/components/dashboard/WatchlistCarousel';
import LatestActivity from '@/components/dashboard/LatestActivity';
import { FileText, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { data: overview, isLoading: overviewLoading } = useDashboardOverview();
  const { data: teamsData, isLoading: teamsLoading } = useDashboardTeams();
  const { data: companiesData, isLoading: companiesLoading } =
    useDashboardCompanies();

  const stats = overview?.stats || {};
  const teams = teamsData?.teams || [];
  const companies = companiesData?.companies || [];

  const totalHealthScore =
    teams.length > 0
      ? Math.round(
          teams.reduce(
            (acc: number, t: { health_score: number }) => acc + t.health_score,
            0,
          ) / teams.length,
        )
      : 100;

  const urgentTasks = (stats.upcoming_deadlines || []).map(
    (task: { days_until: number }) => ({
      ...task,
      status:
        task.days_until < 0
          ? 'late'
          : task.days_until <= 3
            ? 'pending'
            : 'new',
    }),
  );

  const newTasksCount = stats.by_status?.new || 0;
  const pendingCount = stats.by_status?.pending || 0;

  return (
    <div className="container-fluid">
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Stock Cards - Full Width Row */}
        <div className="col-span-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
            <StockCard
              icon={FileText}
              iconBg="bg-blue-100 dark:bg-blue-900/30"
              iconColor="text-blue-600 dark:text-blue-400"
              title="Total Tarefas"
              subtitle="Em andamento"
              value={overviewLoading ? '-' : String(stats.total_tasks || 0)}
              change={newTasksCount}
              trend="up"
              loading={overviewLoading}
            />

            <StockCard
              icon={TrendingUp}
              iconBg={
                totalHealthScore >= 80
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : totalHealthScore >= 50
                    ? 'bg-amber-100 dark:bg-amber-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
              }
              iconColor={
                totalHealthScore >= 80
                  ? 'text-green-600 dark:text-green-400'
                  : totalHealthScore >= 50
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
              }
              title="Health Score"
              subtitle="Performance geral"
              value={teamsLoading ? '-' : `${totalHealthScore}%`}
              badge={totalHealthScore >= 80 ? 'Bom' : totalHealthScore >= 50 ? 'Atencao' : 'Critico'}
              loading={teamsLoading}
            />

            <StockCard
              icon={AlertTriangle}
              iconBg="bg-red-100 dark:bg-red-900/30"
              iconColor="text-red-600 dark:text-red-400"
              title="Atrasadas"
              subtitle="Requer atencao"
              value={overviewLoading ? '-' : String(stats.delayed_tasks || 0)}
              badge={(stats.delayed_tasks || 0) === 0 ? 'Nenhuma' : undefined}
              loading={overviewLoading}
            />

            <StockCard
              icon={CheckCircle}
              iconBg="bg-green-100 dark:bg-green-900/30"
              iconColor="text-green-600 dark:text-green-400"
              title="Concluidas"
              subtitle="Este mes"
              value={
                overviewLoading ? '-' : String(stats.completed_this_month || 0)
              }
              badge={pendingCount > 0 ? `${pendingCount} pendentes` : undefined}
              loading={overviewLoading}
            />
          </div>
        </div>

        {/* Performance Chart - 8 columns on xl */}
        <div className="col-span-12 xl:col-span-8">
          <PerformanceChart loading={overviewLoading} />
        </div>

        {/* Watchlist Carousel - 4 columns on xl */}
        <div className="col-span-12 xl:col-span-4">
          <WatchlistCarousel companies={companies} loading={companiesLoading} />
        </div>

        {/* Trending Tasks - Full Width */}
        <div className="col-span-12">
          <TrendingTasks tasks={urgentTasks} loading={overviewLoading} />
        </div>

        {/* Latest Activity - Full Width */}
        <div className="col-span-12">
          <LatestActivity loading={overviewLoading} />
        </div>
      </div>
    </div>
  );
}
