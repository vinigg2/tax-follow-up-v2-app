import { useState } from 'react';
import { toast } from 'sonner';
import {
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Send,
  Archive,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getInitials } from '@/lib/helpers';
import { ChecklistManager } from './ChecklistManager';
import { useTaskChecklists } from '@/hooks/useChecklists';
import { useTaskTimeline, useAddTimelineEntry, useArchiveTask } from '@/hooks/useTasks';

interface Task {
  id: number | string;
  title: string;
  task_hierarchy_title?: string;
  status: string;
  deadline?: string;
  formatted_deadline?: string;
  days_until?: number;
  responsible_user?: {
    name: string;
    avatar?: string;
  };
  company?: {
    name: string;
  };
  description?: string;
  wsd?: string;
  activities?: ActivityItem[];
}

interface ActivityItem {
  id: string | number;
  user: {
    name: string;
    avatar?: string;
  };
  message: string;
  created_at: string;
}

interface TaskActionsDrawerProps {
  task: Task;
  triggerClassName?: string;
  showTriggerOnHover?: boolean;
}

export function TaskActionsDrawer({
  task,
  triggerClassName,
  showTriggerOnHover = false,
}: TaskActionsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [description, setDescription] = useState(task.description || '');
  const [wsd, setWsd] = useState(task.wsd || '');

  // Fetch checklists from API
  const { data: checklistData } = useTaskChecklists(task.id);
  const checklistItems = checklistData?.checklists || [];

  // Fetch timeline (activities) from API
  const { data: timelineData } = useTaskTimeline(isOpen ? task.id : undefined);
  const activities = (timelineData?.timeline || []).map((entry: any) => ({
    id: entry.id,
    user: entry.user || { name: 'Sistema' },
    message: entry.description || entry.type_label,
    created_at: entry.formatted_date || entry.created_at,
  }));

  // Mutations
  const addTimelineEntry = useAddTimelineEntry();
  const archiveTask = useArchiveTask();

  const isLate = task.days_until !== undefined && task.days_until < 0;
  const delayDays = isLate && task.days_until ? Math.abs(task.days_until) : 0;

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addTimelineEntry.mutateAsync({
        taskId: task.id,
        data: { description: newComment.trim() },
      });
      toast.success('Comentario adicionado!');
      setNewComment('');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(error.response?.data?.message || 'Erro ao adicionar comentario');
    }
  };

  const handleArchiveTask = async () => {
    try {
      await archiveTask.mutateAsync(task.id);
      toast.success('Tarefa arquivada!');
      setIsArchiveDialogOpen(false);
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error archiving task:', error);
      toast.error(error.response?.data?.message || 'Erro ao arquivar tarefa');
    }
  };

  // Calculate progress from real checklist data
  const completedCount = checklistItems.filter((item) => item.status === 'concluido').length;
  const totalCount = checklistItems.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            'p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all',
            showTriggerOnHover && 'opacity-0 group-hover:opacity-100',
            triggerClassName
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col"
        close={false}
      >
        {/* Header com informacoes da tarefa */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          {/* Titulo e Status */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {task.task_hierarchy_title || task.title}
              </h2>
              {task.company?.name && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {task.company.name}
                </p>
              )}
            </div>
            {isLate && (
              <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  {delayDays} dias atrasado
                </span>
              </div>
            )}
          </div>

          {/* Info Row: Prazo e Responsavel */}
          <div className="flex items-center gap-4 text-sm">
            {/* Prazo */}
            <div className="flex items-center gap-2">
              <Calendar
                className={cn(
                  'w-4 h-4',
                  isLate ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
                )}
              />
              <span
                className={cn(
                  isLate
                    ? 'text-red-600 dark:text-red-400 font-medium'
                    : 'text-gray-600 dark:text-gray-300'
                )}
              >
                {task.formatted_deadline || task.deadline || 'Sem prazo'}
              </span>
            </div>

            {/* Responsavel */}
            {task.responsible_user && (
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="text-[10px]">
                    {getInitials(task.responsible_user.name, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-gray-600 dark:text-gray-300">
                  {task.responsible_user.name}
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              <span>Progresso</span>
              <span>
                {completedCount}/{totalCount} ({Math.round(progressPercentage)}%)
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  progressPercentage >= 100
                    ? 'bg-green-500'
                    : progressPercentage >= 50
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                )}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="checklist" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b border-gray-200 dark:border-gray-700 bg-transparent px-6 h-auto py-0 shrink-0">
            <TabsTrigger
              value="checklist"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-3 px-4"
            >
              Checklist
            </TabsTrigger>
            <TabsTrigger
              value="processo"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-3 px-4"
            >
              Processo
            </TabsTrigger>
            <TabsTrigger
              value="atividades"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-3 px-4"
            >
              Atividades
            </TabsTrigger>
            <TabsTrigger
              value="outras"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-3 px-4"
            >
              Outras Info
            </TabsTrigger>
          </TabsList>

          {/* Tab: Checklist */}
          <TabsContent value="checklist" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                <ChecklistManager taskId={task.id} />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab: Processo */}
          <TabsContent value="processo" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                {/* Fluxograma */}
                <div className="flex flex-col items-center gap-2">
                  {checklistItems.map((item, index) => (
                    <div key={item.id} className="w-full">
                      {/* Step */}
                      <div
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border',
                          item.status === 'concluido'
                            ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-700'
                            : item.status === 'em_andamento'
                              ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        )}
                      >
                        <div
                          className={cn(
                            'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                            item.status === 'concluido'
                              ? 'bg-green-500 text-white'
                              : item.status === 'em_andamento'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                          )}
                        >
                          {item.status === 'concluido' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-sm',
                            item.status === 'concluido'
                              ? 'text-green-700 dark:text-green-400'
                              : item.status === 'em_andamento'
                                ? 'text-blue-700 dark:text-blue-400 font-medium'
                                : 'text-gray-600 dark:text-gray-400'
                          )}
                        >
                          {item.title}
                        </span>
                      </div>
                      {/* Connector */}
                      {index < checklistItems.length - 1 && (
                        <div className="flex justify-center py-1">
                          <div
                            className={cn(
                              'w-0.5 h-4',
                              item.status === 'concluido'
                                ? 'bg-green-300 dark:bg-green-700'
                                : 'bg-gray-200 dark:bg-gray-700'
                            )}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab: Atividades */}
          <TabsContent value="atividades" className="flex-1 m-0 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="text-xs">
                        {getInitials(activity.user.name, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.user.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {activity.created_at}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {activity.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Comment input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <div className="flex gap-2 items-center justify-center">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adicionar comentario..."
                  className="input flex-1"
                  disabled={addTimelineEntry.isPending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !addTimelineEntry.isPending) handleSendComment();
                  }}
                />
                <Button
                  onClick={handleSendComment}
                  size="md"
                  disabled={addTimelineEntry.isPending || !newComment.trim()}
                >
                  {addTimelineEntry.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Outras Informacoes */}
          <TabsContent value="outras" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {/* Descricao */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Descricao
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Adicione uma descricao para esta tarefa..."
                    rows={4}
                    className="input resize-none"
                  />
                </div>

                {/* WSD */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    WSD
                  </label>
                  <input
                    type="text"
                    value={wsd}
                    onChange={(e) => setWsd(e.target.value)}
                    placeholder="Codigo WSD"
                    className="input"
                  />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex gap-3 items-center justify-end">
            <Button
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 max-w-1/2"
              onClick={() => setIsArchiveDialogOpen(true)}
            >
              <Archive className="w-4 h-4 mr-2" />
              Arquivar
            </Button>
          </div>
        </div>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Arquivar tarefa</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja arquivar a tarefa "{task.task_hierarchy_title || task.title}"?
                A tarefa sera movida para a lista de arquivadas e podera ser restaurada posteriormente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={archiveTask.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleArchiveTask}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={archiveTask.isPending}
              >
                {archiveTask.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Arquivar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
