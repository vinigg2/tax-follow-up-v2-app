import { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { tasksApi } from '@/api/tasks';
import { toast } from 'sonner';

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

interface KanbanBoardProps {
  tasks?: Task[];
  loading?: boolean;
  queryKey?: (string | Record<string, unknown>)[];
}

const STATUSES = ['new', 'pending', 'late', 'finished', 'rectified'] as const;
type TaskStatus = (typeof STATUSES)[number];

export default function KanbanBoard({
  tasks = [],
  loading = false,
  queryKey = ['tasks', 'currentIteration', {}],
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overId, setOverId] = useState<string | number | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const queryClient = useQueryClient();

  // Sync local tasks with props when they change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      new: [],
      pending: [],
      late: [],
      finished: [],
      rectified: [],
    };

    localTasks.forEach((task) => {
      const status = (task.status || 'new') as TaskStatus;
      if (grouped[status]) {
        grouped[status].push(task);
      } else {
        grouped.new.push(task);
      }
    });

    // Sort tasks within each column by deadline
    (Object.keys(grouped) as TaskStatus[]).forEach((status) => {
      grouped[status].sort((a, b) => {
        if (a.days_until === undefined && b.days_until === undefined) return 0;
        if (a.days_until === undefined) return 1;
        if (b.days_until === undefined) return -1;
        return a.days_until - b.days_until;
      });
    });

    return grouped;
  }, [localTasks]);

  // Mutation for updating task status
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number | string; status: string }) =>
      tasksApi.update(taskId, { status }),
    onError: (
      error: unknown,
      { taskId, oldStatus }: { taskId: number | string; oldStatus: string }
    ) => {
      // Rollback on error - restore old status
      setLocalTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: oldStatus } : task
        )
      );
      // Show specific error message from backend
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erro ao atualizar status da tarefa');
    },
    onSuccess: () => {
      toast.success('Status atualizado');
    },
    onSettled: () => {
      // Refetch to ensure consistency with server
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = localTasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);
    setOverId(null);

    if (!over) return;

    const taskId = active.id;
    const task = localTasks.find((t) => t.id === taskId);

    if (!task) return;

    // Determine the target status
    let targetStatus: string | null = null;

    // Check if dropped directly on a column
    if (STATUSES.includes(over.id as TaskStatus)) {
      targetStatus = over.id as string;
    } else {
      // Dropped on a task - find which column it belongs to
      const overTask = localTasks.find((t) => t.id === over.id);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    // Only update if the status changed
    if (targetStatus && targetStatus !== task.status) {
      // Prevent changing rectified tasks
      if (task.status === 'rectified') {
        toast.error('Tarefas retificadas nao podem ser movidas');
        return;
      }

      // Prevent moving to rectified status via drag
      if (targetStatus === 'rectified') {
        toast.error('Use a funcao de retificar para criar tarefas retificadas');
        return;
      }

      const oldStatus = task.status;

      // Optimistically update local state immediately
      setLocalTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: targetStatus! } : t
        )
      );

      // Send update to server
      updateTaskMutation.mutate({ taskId, status: targetStatus, oldStatus });
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setOverId(null);
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <div
            key={status}
            className="flex flex-col min-w-[320px] max-w-[360px] rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 animate-pulse"
          >
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
                  <div className="w-24 h-5 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
            <div className="p-3 space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            isOver={overId === status}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
