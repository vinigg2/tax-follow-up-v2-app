import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  GripVertical,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  LucideIcon,
} from 'lucide-react';
import { TaskActionsDrawer } from '@/components/tasks/TaskActionsDrawer';

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

interface KanbanCardProps {
  task: Task;
  isDragging?: boolean;
}

interface StatusConfig {
  color: string;
  icon: LucideIcon;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  new: { color: 'blue', icon: Clock },
  pending: { color: 'warning', icon: Clock },
  late: { color: 'error', icon: AlertTriangle },
  finished: { color: 'success', icon: CheckCircle },
  rectified: { color: 'purple', icon: CheckCircle },
};

export default function KanbanCard({
  task,
  isDragging = false,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isUrgent =
    task.days_until !== undefined && task.days_until <= 3 && task.days_until >= 0;
  const isLate = task.days_until !== undefined && task.days_until < 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group bg-white dark:bg-gray-800 rounded-xl border shadow-sm transition-all',
        isDragging || isSortableDragging
          ? 'shadow-lg border-blue-300 dark:border-blue-600 opacity-90 rotate-2 scale-105'
          : 'border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
        isLate && 'border-l-4 border-l-red-500',
        isUrgent && !isLate && 'border-l-4 border-l-amber-500'
      )}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing rounded hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <Link
              to={`/tasks/${task.id}`}
              className="block font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
            >
              {task.task_hierarchy_title || task.title}
            </Link>

            {/* Company */}
            {task.company?.name && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <Building2 className="w-3.5 h-3.5" />
                <span className="truncate">{task.company.name}</span>
              </div>
            )}

            {/* Competency */}
            {task.competency && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {task.competency}
              </p>
            )}
          </div>

          {/* Menu */}
          <TaskActionsDrawer task={task} showTriggerOnHover />
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
        <div className="flex items-center justify-between">
          {/* Deadline */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium',
                isLate
                  ? 'text-red-600 dark:text-red-400'
                  : isUrgent
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-500 dark:text-gray-400'
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{task.formatted_deadline || task.deadline}</span>
            </div>
            {isLate && (
              <Badge variant="destructive">
                {Math.abs(Math.round(task.days_until!))}d atrasado
              </Badge>
            )}
            {isUrgent && !isLate && (
              <Badge variant="warning">{Math.round(task.days_until!)}d</Badge>
            )}
          </div>

          {/* Progress */}
          {task.percent !== undefined && (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    task.percent >= 100
                      ? 'bg-green-500'
                      : task.percent >= 50
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                  )}
                  style={{ width: `${Math.min(100, task.percent)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(task.percent)}%
              </span>
            </div>
          )}
        </div>

        {/* Responsible User */}
        {task.responsible_user?.name && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
              {task.responsible_user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {task.responsible_user.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
