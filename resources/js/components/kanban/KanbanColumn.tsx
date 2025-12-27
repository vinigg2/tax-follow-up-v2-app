import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import { cn } from '@/lib/utils';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  LucideIcon,
} from 'lucide-react';

interface Task {
  id: number | string;
  title: string;
  task_hierarchy_title?: string;
  status: string;
  days_until?: number;
  deadline?: string;
  formatted_deadline?: string;
  percent?: number;
  competency?: string;
  company?: {
    name: string;
  };
  responsible_user?: {
    name: string;
  };
}

interface KanbanColumnProps {
  status: string;
  tasks?: Task[];
  isOver?: boolean;
}

interface ColumnConfig {
  title: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  countBg: string;
}

const COLUMN_CONFIG: Record<string, ColumnConfig> = {
  new: {
    title: 'Novas',
    icon: Clock,
    color: 'blue',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    countBg: 'bg-blue-100 dark:bg-blue-900/40',
  },
  pending: {
    title: 'Pendentes',
    icon: Clock,
    color: 'warning',
    bgColor: 'bg-warning-50 dark:bg-warning-900/20',
    borderColor: 'border-warning-200 dark:border-warning-800',
    iconColor: 'text-warning-600 dark:text-warning-400',
    countBg: 'bg-warning-100 dark:bg-warning-900/40',
  },
  late: {
    title: 'Atrasadas',
    icon: AlertTriangle,
    color: 'error',
    bgColor: 'bg-error-50 dark:bg-error-900/20',
    borderColor: 'border-error-200 dark:border-error-800',
    iconColor: 'text-error-600 dark:text-error-400',
    countBg: 'bg-error-100 dark:bg-error-900/40',
  },
  finished: {
    title: 'Concluidas',
    icon: CheckCircle,
    color: 'success',
    bgColor: 'bg-success-50 dark:bg-success-900/20',
    borderColor: 'border-success-200 dark:border-success-800',
    iconColor: 'text-success-600 dark:text-success-400',
    countBg: 'bg-success-100 dark:bg-success-900/40',
  },
  rectified: {
    title: 'Retificadas',
    icon: RefreshCw,
    color: 'purple',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    iconColor: 'text-purple-600 dark:text-purple-400',
    countBg: 'bg-purple-100 dark:bg-purple-900/40',
  },
};

export default function KanbanColumn({
  status,
  tasks = [],
  isOver = false,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const config = COLUMN_CONFIG[status] || COLUMN_CONFIG.new;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex flex-col min-w-[320px] max-w-[360px] rounded-xl border-2 transition-all',
        config.bgColor,
        isOver
          ? 'border-blue-400 dark:border-blue-500 scale-[1.02]'
          : config.borderColor
      )}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg',
                config.countBg
              )}
            >
              <Icon className={cn('w-4 h-4', config.iconColor)} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {config.title}
              </h3>
            </div>
          </div>
          <div
            className={cn(
              'flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg text-sm font-medium',
              config.countBg,
              config.iconColor
            )}
          >
            {tasks.length}
          </div>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px] max-h-[calc(100vh-300px)]',
          'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent'
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-full mb-3',
                config.countBg
              )}
            >
              <Icon className={cn('w-6 h-6', config.iconColor)} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma tarefa
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Arraste tarefas para ca
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
