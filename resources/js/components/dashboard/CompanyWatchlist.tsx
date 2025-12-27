import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Building2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

interface Company {
  id: number | string;
  name: string;
  health_score?: number;
  total_tasks?: number;
  delayed_tasks?: number;
  pending_tasks?: number;
}

interface CompanyWatchlistProps {
  companies?: Company[];
  loading?: boolean;
}

export default function CompanyWatchlist({
  companies = [],
  loading = false,
}: CompanyWatchlistProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Minhas Empresas
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Acompanhe o status das tarefas por empresa
          </p>
        </div>
        {/* Loading skeleton */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Minhas Empresas
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Acompanhe o status das tarefas por empresa
          </p>
        </div>
        {/* Empty state */}
        <div className="p-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="mt-4 text-base font-medium text-gray-800 dark:text-white/90">
            Nenhuma empresa
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Adicione empresas para acompanhar suas obrigacoes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Minhas Empresas
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Acompanhe o status das tarefas por empresa
          </p>
        </div>
        <Link
          to="/companies"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Ver todas
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Company Grid */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.slice(0, 6).map((company) => {
          const healthScore = company.health_score || 0;
          const isHealthy = healthScore >= 80;
          const isWarning = healthScore >= 50 && healthScore < 80;
          const totalTasks = company.total_tasks || 0;
          const delayedTasks = company.delayed_tasks || 0;

          return (
            <Link
              key={company.id}
              to={`/companies/${company.id}`}
              className="group p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
            >
              {/* Company Info */}
              <div className="flex items-center gap-3 mb-4">
                {/* Avatar */}
                <div
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-xl text-base font-bold',
                    isHealthy
                      ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400'
                      : isWarning
                        ? 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400'
                        : 'bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400'
                  )}
                >
                  {company.name?.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">
                    {company.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {totalTasks} tarefas
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Health Score
                  </p>
                  <p
                    className={cn(
                      'text-lg font-bold',
                      isHealthy
                        ? 'text-success-600 dark:text-success-400'
                        : isWarning
                          ? 'text-warning-600 dark:text-warning-400'
                          : 'text-error-600 dark:text-error-400'
                    )}
                  >
                    {healthScore}%
                  </p>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                    delayedTasks > 0
                      ? 'bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400'
                      : isHealthy
                        ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400'
                        : 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400'
                  )}
                >
                  {delayedTasks > 0 ? (
                    <>
                      <TrendingDown className="w-3 h-3" />
                      {delayedTasks} atrasadas
                    </>
                  ) : isHealthy ? (
                    <>
                      <TrendingUp className="w-3 h-3" />
                      Em dia
                    </>
                  ) : (
                    <>
                      <Minus className="w-3 h-3" />
                      {company.pending_tasks || 0} pendentes
                    </>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
