import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  MessageSquare,
  UserPlus,
  LucideIcon,
} from 'lucide-react';
import { useDashboardRecentActivities } from '@/hooks/useDashboard';

type ActivityType =
  | 'task_created'
  | 'task_completed'
  | 'task_delayed'
  | 'document_uploaded'
  | 'comment_added'
  | 'user_assigned';

interface Activity {
  id: number | string;
  type: ActivityType;
  title: string;
  user: string;
  date: string;
  company: string;
}

interface LatestActivityProps {
  activities?: Activity[];
  loading?: boolean;
}

interface ActivityConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
}

const ACTIVITY_TYPES: Record<ActivityType, ActivityConfig> = {
  task_created: {
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Nova tarefa',
  },
  task_completed: {
    icon: CheckCircle,
    color: 'text-success-600 dark:text-success-400',
    bg: 'bg-success-100 dark:bg-success-900/30',
    label: 'Concluida',
  },
  task_delayed: {
    icon: AlertTriangle,
    color: 'text-error-600 dark:text-error-400',
    bg: 'bg-error-100 dark:bg-error-900/30',
    label: 'Atrasada',
  },
  document_uploaded: {
    icon: Upload,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Upload',
  },
  comment_added: {
    icon: MessageSquare,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Comentario',
  },
  user_assigned: {
    icon: UserPlus,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'Atribuicao',
  },
};

export default function LatestActivity({
  activities: externalActivities,
  loading: externalLoading = false,
}: LatestActivityProps) {
  const { data: activitiesResponse, isLoading: activitiesLoading } = useDashboardRecentActivities(15);

  const loading = externalLoading || activitiesLoading;
  const activities = externalActivities || (activitiesResponse?.activities as Activity[]) || [];
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="animate-pulse flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-3">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </th>
                <th className="px-6 py-3">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </th>
                <th className="px-6 py-3">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </th>
                <th className="px-6 py-3">
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr
                  key={i}
                  className="border-b border-gray-50 dark:border-gray-800/50"
                >
                  <td className="px-6 py-4">
                    <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            Atividades Recentes
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ultimas movimentacoes no sistema
          </p>
        </div>
        <Link
          to="/timeline"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Ver todas
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Atividade
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Empresa
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {activities.slice(0, 5).map((activity) => {
              const config =
                ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.task_created;
              const Icon = config.icon;

              return (
                <tr
                  key={activity.id}
                  className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex items-center justify-center w-10 h-10 rounded-lg',
                          config.bg
                        )}
                      >
                        <Icon className={cn('w-5 h-5', config.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.date}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {activity.company}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {activity.user}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                        config.bg,
                        config.color
                      )}
                    >
                      {config.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Mostrando 5 de {activities.length} atividades
        </p>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              className={cn(
                'px-3 py-1 text-sm rounded-lg transition-colors',
                page === 1
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
