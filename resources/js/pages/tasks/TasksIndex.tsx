import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { useTeams } from '@/hooks/useTeams';
import { useCompanies } from '@/hooks/useCompanies';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { TaskActionsDrawer } from '@/components/tasks/TaskActionsDrawer';
import { TaskFormDrawer } from '@/components/tasks/TaskFormDrawer';
import { cn } from '@/lib/utils';
import {
  ListTodo,
  Clock,
  AlertTriangle,
  CheckCircle,
  Archive,
  Search,
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
  LucideIcon,
  Users,
  Building2,
  Filter,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface StatusConfig {
  label: string;
  variant: string;
  icon: LucideIcon;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  new: { label: 'Nova', variant: 'blue', icon: ListTodo },
  pending: { label: 'Pendente', variant: 'warning', icon: Clock },
  late: { label: 'Atrasada', variant: 'error', icon: AlertTriangle },
  finished: { label: 'Finalizada', variant: 'success', icon: CheckCircle },
  rectified: { label: 'Retificada', variant: 'purple', icon: Archive },
};

interface FilterOption {
  key: string;
  label: string;
  icon: LucideIcon;
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'currentIteration', label: 'Todas', icon: ListTodo },
  { key: 'myTasks', label: 'Minhas', icon: Clock },
  { key: 'delayedTasks', label: 'Atrasadas', icon: AlertTriangle },
  { key: 'archivedTasks', label: 'Arquivadas', icon: Archive },
];

interface Task {
  id: number | string;
  title: string;
  task_hierarchy_title?: string;
  status: string;
  percent?: number;
  formatted_deadline?: string;
  competency?: string;
  company?: {
    id: number;
    name: string;
  };
  team_id?: number;
}

export default function TasksIndex() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [method, setMethod] = useState('currentIteration');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [teamFilter, setTeamFilter] = useState<number | undefined>();
  const [companyFilter, setCompanyFilter] = useState<number | undefined>();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  // Check if user can manage content (admin or manager in any group)
  const canManageContent = useMemo(() => {
    const adminGroups = permissions.admin_groups || [];
    const ownerGroups = permissions.owner_groups || [];
    const managerGroups = permissions.manager_groups || [];
    return adminGroups.length > 0 || ownerGroups.length > 0 || managerGroups.length > 0;
  }, [permissions]);

  // Pass show_completed: true for kanban view to show finished tasks
  const { data, isLoading, error } = useTasks(method, {
    show_completed: viewMode === 'kanban',
  });
  const { data: teamsData } = useTeams();
  const { data: companiesData } = useCompanies({ group_id: teamFilter });

  const tasks = (data?.tasks || []) as Task[];
  const teams = teamsData?.teams || [];
  const companies = companiesData?.companies || [];

  const activeFiltersCount = (teamFilter ? 1 : 0) + (companyFilter ? 1 : 0);

  // Filter tasks by search term and filters
  const filteredTasks = tasks.filter((task) => {
    // Team filter
    if (teamFilter && task.team_id !== teamFilter) return false;

    // Company filter
    if (companyFilter && task.company?.id !== companyFilter) return false;

    // Search term
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      task.task_hierarchy_title?.toLowerCase().includes(search) ||
      task.title?.toLowerCase().includes(search) ||
      task.company?.name?.toLowerCase().includes(search) ||
      task.competency?.toLowerCase().includes(search)
    );
  });

  const clearFilters = () => {
    setTeamFilter(undefined);
    setCompanyFilter(undefined);
  };

  return (
    <div className="container-fluid space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('tasks.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie suas tarefas fiscais e acompanhe os prazos
          </p>
        </div>

        {/* Search, Filters, View Toggle and Create Button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full sm:w-64"
            />
          </div>

          {/* Filters Popover */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer',
                  activeFiltersCount > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                )}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 text-xs font-semibold bg-blue-600 text-white rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">Filtros</h4>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Team Filter */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Users className="w-4 h-4" />
                    Equipe
                  </label>
                  <select
                    value={teamFilter || ''}
                    onChange={(e) => {
                      setTeamFilter(e.target.value ? Number(e.target.value) : undefined);
                      setCompanyFilter(undefined);
                    }}
                    className="input w-full"
                  >
                    <option value="">Todas as equipes</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company Filter */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Building2 className="w-4 h-4" />
                    Empresa
                  </label>
                  <select
                    value={companyFilter || ''}
                    onChange={(e) => setCompanyFilter(e.target.value ? Number(e.target.value) : undefined)}
                    className="input w-full"
                  >
                    <option value="">Todas as empresas</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer',
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer',
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          {/* Create Task Button - Only for managers and admins */}
          {canManageContent && (
            <Button
              onClick={() => setIsCreateDrawerOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nova Tarefa</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          )}
        </div>
      </div>

      {/* Task Form Drawer */}
      {canManageContent && (
        <TaskFormDrawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen} />
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {FILTER_OPTIONS.map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.key}
              onClick={() => setMethod(filter.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                method === filter.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400">Filtros ativos:</span>
          {teamFilter && (
            <Badge variant="secondary" className="gap-1.5">
              <Users className="w-3 h-3" />
              {teams.find((t) => t.id === teamFilter)?.name}
              <button
                onClick={() => {
                  setTeamFilter(undefined);
                  setCompanyFilter(undefined);
                }}
                className="ml-1 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {companyFilter && (
            <Badge variant="secondary" className="gap-1.5">
              <Building2 className="w-3 h-3" />
              {companies.find((c) => c.id === companyFilter)?.name}
              <button
                onClick={() => setCompanyFilter(undefined)}
                className="ml-1 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* Content */}
      {error ? (
        <div className="card p-8 text-center">
          <AlertTriangle className="mx-auto w-12 h-12 text-error-500" />
          <p className="mt-4 text-gray-900 dark:text-white font-medium">
            Erro ao carregar tarefas
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tente novamente mais tarde
          </p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban View */
        <KanbanBoard
          tasks={filteredTasks as any}
          loading={isLoading}
          queryKey={['tasks', method, {}]}
        />
      ) : isLoading ? (
        <div className="card p-12">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card">
          <EmptyState
            illustration="/images/illustrations/5.svg"
            illustrationDark="/images/illustrations/5-dark.svg"
            title={searchTerm ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa'}
            description={
              searchTerm
                ? 'Tente ajustar os termos da busca'
                : canManageContent
                  ? 'Nao ha tarefas nesta categoria. Crie uma nova tarefa para comecar.'
                  : 'Nao ha tarefas nesta categoria.'
            }
            action={
              !searchTerm && canManageContent
                ? {
                    label: 'Nova Tarefa',
                    onClick: () => setIsCreateDrawerOpen(true),
                    icon: Plus,
                  }
                : undefined
            }
          />
        </div>
      ) : (
        /* List View */
        <div className="card overflow-hidden">
          <div className="table-container border-0">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Tarefa</th>
                  <th>Empresa</th>
                  <th>Prazo</th>
                  <th>Status</th>
                  <th>Progresso</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredTasks.map((task) => {
                  const statusConfig =
                    STATUS_CONFIG[task.status] || STATUS_CONFIG.new;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr
                      key={task.id}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="cursor-pointer"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex items-center justify-center w-10 h-10 rounded-lg',
                              task.status === 'late'
                                ? 'bg-red-100 dark:bg-red-900/30'
                                : task.status === 'finished'
                                  ? 'bg-green-100 dark:bg-green-900/30'
                                  : task.status === 'pending'
                                    ? 'bg-amber-100 dark:bg-amber-900/30'
                                    : 'bg-blue-100 dark:bg-blue-900/30'
                            )}
                          >
                            <StatusIcon
                              className={cn(
                                'w-5 h-5',
                                task.status === 'late'
                                  ? 'text-red-600 dark:text-red-400'
                                  : task.status === 'finished'
                                    ? 'text-green-600 dark:text-green-400'
                                    : task.status === 'pending'
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-blue-600 dark:text-blue-400'
                              )}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {task.task_hierarchy_title || task.title}
                            </p>
                            {task.competency && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {task.competency}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="text-gray-600 dark:text-gray-300">
                          {task.company?.name}
                        </p>
                      </td>
                      <td>
                        <p className="text-gray-600 dark:text-gray-300">
                          {task.formatted_deadline}
                        </p>
                      </td>
                      <td>
                        <Badge
                          variant={
                            statusConfig.variant === 'error'
                              ? 'destructive'
                              : statusConfig.variant === 'warning'
                                ? 'warning'
                                : 'secondary'
                          }
                        >
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-3 min-w-[120px]">
                          <Progress
                            value={task.percent || 0}
                            className="flex-1 h-2"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[2.5rem] text-right">
                            {Math.round(task.percent || 0)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <TaskActionsDrawer task={task} />
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary - Only show in list view */}
      {!isLoading && filteredTasks.length > 0 && viewMode === 'list' && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <p>
            Mostrando {filteredTasks.length} de {tasks.length} tarefas
            {searchTerm && ` (filtrado por "${searchTerm}")`}
          </p>
        </div>
      )}
    </div>
  );
}
