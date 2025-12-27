import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle,
  FileText,
  Clock,
  AlertTriangle,
  LucideIcon,
} from 'lucide-react';

interface Task {
  id: number | string;
  title: string;
  company: string;
  deadline: string;
  days_until: number;
  status?: string;
}

interface TrendingTasksProps {
  tasks?: Task[];
  loading?: boolean;
}

type StatusKey = 'new' | 'pending' | 'late' | 'finished';

interface StatusConfig {
  icon: LucideIcon;
  bg: string;
  color: string;
}

const STATUS_ICONS: Record<StatusKey, StatusConfig> = {
  new: {
    icon: FileText,
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    color: 'text-blue-600 dark:text-blue-400',
  },
  pending: {
    icon: Clock,
    bg: 'bg-warning-100 dark:bg-warning-900/30',
    color: 'text-warning-600 dark:text-warning-400',
  },
  late: {
    icon: AlertTriangle,
    bg: 'bg-error-100 dark:bg-error-900/30',
    color: 'text-error-600 dark:text-error-400',
  },
  finished: {
    icon: CheckCircle,
    bg: 'bg-success-100 dark:bg-success-900/30',
    color: 'text-success-600 dark:text-success-400',
  },
};

export default function TrendingTasks({
  tasks = [],
  loading = false,
}: TrendingTasksProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="animate-pulse flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-6 py-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                  <div className="space-y-2">
                    <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Tarefas Urgentes
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Prazos proximos que precisam de atencao
          </p>
        </div>
        <div className="p-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-success-100 dark:bg-success-900/30">
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
          <h4 className="mt-4 text-base font-medium text-gray-800 dark:text-white/90">
            Tudo em dia!
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Nenhuma tarefa urgente no momento
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
            Tarefas Urgentes
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Prazos proximos que precisam de atencao
          </p>
        </div>
        <Link
          to="/tasks?filter=delayedTasks"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Ver todas
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Task List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {tasks.slice(0, 5).map((task) => {
          const isLate = task.days_until < 0;
          const isUrgent = task.days_until >= 0 && task.days_until <= 3;
          const status: StatusKey = isLate ? 'late' : isUrgent ? 'pending' : 'new';
          const statusConfig = STATUS_ICONS[status];
          const StatusIcon = statusConfig.icon;

          const daysText = isLate
            ? `${Math.abs(Math.round(task.days_until))}d atrasado`
            : task.days_until === 0
              ? 'Hoje'
              : `${Math.round(task.days_until)}d`;

          return (
            <div
              key={task.id}
              className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left: Icon + Info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className={cn(
                      'flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl',
                      statusConfig.bg
                    )}
                  >
                    <StatusIcon className={cn('w-6 h-6', statusConfig.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">
                      {task.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {task.company}
                    </p>
                  </div>
                </div>

                {/* Center: Deadline + Days */}
                <div className="hidden sm:flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {task.deadline}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Prazo
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                      isLate
                        ? 'bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400'
                        : isUrgent
                          ? 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400'
                          : 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400'
                    )}
                  >
                    {isLate ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                    {daysText}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/tasks/${task.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-white/[0.03] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05] transition-colors"
                  >
                    Ver Tarefa
                  </Link>
                  <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    Finalizar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
