import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  History,
  ListChecks,
  MoreHorizontal,
  Edit,
  Archive,
  Send,
  ListTodo,
  Loader2,
} from 'lucide-react';
import { useTask, useTaskTimeline, useAddTimelineEntry } from '@/hooks/useTasks';
import { useTaskChecklists } from '@/hooks/useChecklists';
import { ScreenLoader } from '@/components/screen-loader';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChecklistManager } from '@/components/tasks/ChecklistManager';
import { TaskFormDrawer } from '@/components/tasks/TaskFormDrawer';
import { DocumentManager } from '@/components/documents';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/helpers';
import { useAuth } from '@/hooks/useAuth';

interface TimelineEntry {
  id: number;
  type: string;
  description?: string;
  user_name?: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: string; icon: React.ElementType }> = {
  new: { label: 'Nova', variant: 'blue', icon: ListTodo },
  pending: { label: 'Pendente', variant: 'warning', icon: Clock },
  late: { label: 'Atrasada', variant: 'error', icon: AlertTriangle },
  finished: { label: 'Finalizada', variant: 'success', icon: CheckCircle },
  rectified: { label: 'Retificada', variant: 'purple', icon: Archive },
};

export default function TaskView() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const { data: taskData, isLoading: taskLoading } = useTask(id);
  const { data: timelineData, isLoading: timelineLoading } = useTaskTimeline(id);
  const { data: checklistData, isLoading: checklistLoading } = useTaskChecklists(id);
  const addTimelineEntry = useAddTimelineEntry();

  if (taskLoading) return <ScreenLoader />;

  const task = taskData?.task;
  const checklistItems = checklistData?.checklists || [];

  if (!task) {
    return (
      <div className="container-fluid">
        <EmptyState
          illustration="/images/illustrations/5.svg"
          illustrationDark="/images/illustrations/5-dark.svg"
          title="Tarefa nao encontrada"
          description="A tarefa que voce esta procurando nao existe ou foi removida."
          action={{
            label: 'Voltar para tarefas',
            onClick: () => navigate('/tasks'),
          }}
        />
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.new;
  const StatusIcon = statusConfig.icon;
  const isLate = task.days_until !== undefined && task.days_until < 0;
  const delayDays = isLate && task.days_until ? Math.abs(task.days_until) : 0;

  // Calculate progress from checklist
  const completedCount = checklistItems.filter((item: any) => item.status === 'concluido').length;
  const totalCount = checklistItems.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : (task.percent || 0);

  const handleSendComment = async () => {
    if (!newComment.trim() || !id) return;

    try {
      await addTimelineEntry.mutateAsync({
        taskId: id,
        data: {
          type: 'free_text',
          description: newComment.trim(),
        },
      });
      toast.success('Comentario adicionado!');
      setNewComment('');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erro ao adicionar comentario');
    }
  };

  return (
    <div className="container-fluid space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/tasks')}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors shrink-0 mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {task.task_hierarchy_title || task.title}
              </h1>
              <Badge
                variant={
                  statusConfig.variant === 'error'
                    ? 'destructive'
                    : statusConfig.variant === 'warning'
                      ? 'warning'
                      : statusConfig.variant === 'success'
                        ? 'success'
                        : 'secondary'
                }
                className="gap-1.5"
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </Badge>
              {isLate && (
                <Badge variant="destructive" className="gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {delayDays} dias atrasado
                </Badge>
              )}
            </div>
            {task.description && (
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" className="gap-2" onClick={() => setEditDrawerOpen(true)}>
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-red-600 dark:text-red-400">
                <Archive className="w-4 h-4 mr-2" />
                Arquivar tarefa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Company */}
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Empresa</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {task.company?.name || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Deadline */}
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg',
              isLate ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
            )}>
              <Calendar className={cn(
                'w-5 h-5',
                isLate ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
              )} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Prazo</p>
              <p className={cn(
                'text-sm font-medium truncate',
                isLate ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
              )}>
                {task.formatted_deadline || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Responsible */}
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Responsavel</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {task.responsible_name || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg',
              progressPercentage >= 100
                ? 'bg-green-100 dark:bg-green-900/30'
                : progressPercentage >= 50
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-gray-100 dark:bg-gray-800'
            )}>
              <CheckCircle className={cn(
                'w-5 h-5',
                progressPercentage >= 100
                  ? 'text-green-600 dark:text-green-400'
                  : progressPercentage >= 50
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Progresso</p>
              <div className="flex items-center gap-2">
                <Progress value={progressPercentage} className="flex-1 h-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {progressPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tabs */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <Tabs defaultValue="checklist" className="flex flex-col">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 pt-4">
                <TabsList className="bg-transparent p-0 h-auto gap-6">
                  <TabsTrigger
                    value="checklist"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent pb-3 px-0 text-gray-500 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                  >
                    <ListChecks className="w-4 h-4 mr-2" />
                    Checklist
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent pb-3 px-0 text-gray-500 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Documentos
                  </TabsTrigger>
                  <TabsTrigger
                    value="process"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent pb-3 px-0 text-gray-500 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                  >
                    <History className="w-4 h-4 mr-2" />
                    Processo
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab: Checklist */}
              <TabsContent value="checklist" className="m-0">
                <div className="p-6">
                  {checklistLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <ChecklistManager taskId={task.id} />
                  )}
                </div>
              </TabsContent>

              {/* Tab: Documents */}
              <TabsContent value="documents" className="m-0">
                <div className="p-6">
                  <DocumentManager
                    taskId={task.id}
                    documents={task.documents || []}
                    currentUserId={user?.id}
                  />
                </div>
              </TabsContent>

              {/* Tab: Process */}
              <TabsContent value="process" className="m-0">
                <div className="p-6">
                  {checklistLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : checklistItems.length > 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      {checklistItems.map((item: any, index: number) => (
                        <div key={item.id} className="w-full">
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
                  ) : (
                    <EmptyState
                      illustration="/images/illustrations/5.svg"
                      illustrationDark="/images/illustrations/5-dark.svg"
                      title="Nenhuma etapa"
                      description="Esta tarefa nao possui etapas de processo definidas."
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Column - Timeline & Info */}
        <div className="space-y-6">
          {/* Additional Info */}
          {task.competency && (
            <div className="card p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Competencia
              </h3>
              <p className="text-gray-900 dark:text-white font-medium">
                {task.competency}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4" />
                {t('tasks.timeline')}
              </h3>
            </div>
            <ScrollArea className="h-100">
              <div className="p-4">
                {timelineLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : timelineData?.timeline && timelineData.timeline.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-6">
                      {timelineData.timeline.map((entry: TimelineEntry) => (
                        <div key={entry.id} className="relative pl-10">
                          <div className="absolute left-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-[10px] bg-blue-500 text-white">
                                {entry.user_name ? getInitials(entry.user_name, 2) : 'S'}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {entry.user_name || 'Sistema'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(entry.created_at).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {entry.description || entry.type}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Nenhum evento registrado
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Comment input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
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
                  size="icon"
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
          </div>
        </div>
      </div>

      {/* Edit Task Drawer */}
      <TaskFormDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        task={task}
      />
    </div>
  );
}
