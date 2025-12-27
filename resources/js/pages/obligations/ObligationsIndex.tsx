import { useState } from 'react';
import { useObligations, useDeleteObligation, useGenerateTasks } from '@/hooks/useObligations';
import {
  Obligation,
  OBLIGATION_KINDS,
  OBLIGATION_FREQUENCIES,
  ObligationKind,
  ObligationFrequency,
} from '@/api/obligations';
import { ObligationFormModal } from '@/components/obligations/ObligationFormModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ClipboardList,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  Building2,
  Zap,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FREQUENCY_COLORS: Record<ObligationFrequency, string> = {
  MM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  QT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  AA: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function ObligationsIndex() {
  const [searchTerm, setSearchTerm] = useState('');
  const [kindFilter, setKindFilter] = useState<ObligationKind | undefined>();
  const [frequencyFilter, setFrequencyFilter] = useState<ObligationFrequency | undefined>();

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedObligation, setSelectedObligation] = useState<Obligation | null>(null);

  // Delete confirmation
  const [obligationToDelete, setObligationToDelete] = useState<Obligation | null>(null);

  // Generate tasks confirmation
  const [obligationToGenerate, setObligationToGenerate] = useState<Obligation | null>(null);

  const { data, isLoading, error } = useObligations({ kind: kindFilter, frequency: frequencyFilter });
  const deleteObligation = useDeleteObligation();
  const generateTasks = useGenerateTasks();

  const obligations = data?.obligations || [];

  const filteredObligations = obligations.filter((obligation) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      obligation.title.toLowerCase().includes(search) ||
      obligation.description?.toLowerCase().includes(search)
    );
  });

  const handleCreateObligation = () => {
    setSelectedObligation(null);
    setIsFormModalOpen(true);
  };

  const handleEditObligation = (obligation: Obligation) => {
    setSelectedObligation(obligation);
    setIsFormModalOpen(true);
  };

  const handleDeleteObligation = async () => {
    if (!obligationToDelete) return;
    try {
      await deleteObligation.mutateAsync(obligationToDelete.id);
      setObligationToDelete(null);
    } catch (error) {
      console.error('Error deleting obligation:', error);
    }
  };

  const handleGenerateTasks = async () => {
    if (!obligationToGenerate) return;
    try {
      await generateTasks.mutateAsync({ id: obligationToGenerate.id });
      setObligationToGenerate(null);
    } catch (error) {
      console.error('Error generating tasks:', error);
    }
  };

  return (
    <div className="container-fluid space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Obrigacoes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie as obrigacoes fiscais e configure a geracao de tarefas
          </p>
        </div>

        {/* Search and Create Button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar obrigacoes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full sm:w-64"
            />
          </div>
          <Button
            onClick={handleCreateObligation}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nova Obrigacao</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Kind Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Tipo:</span>
          <select
            value={kindFilter || ''}
            onChange={(e) => setKindFilter(e.target.value as ObligationKind || undefined)}
            className="input py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(OBLIGATION_KINDS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Frequency Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Frequencia:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFrequencyFilter(undefined)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                !frequencyFilter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              Todas
            </button>
            {Object.entries(OBLIGATION_FREQUENCIES).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFrequencyFilter(value as ObligationFrequency)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                  frequencyFilter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="card p-8 text-center">
          <ClipboardList className="mx-auto w-12 h-12 text-red-500" />
          <p className="mt-4 text-gray-900 dark:text-white font-medium">
            Erro ao carregar obrigacoes
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tente novamente mais tarde
          </p>
        </div>
      ) : isLoading ? (
        <div className="card overflow-hidden">
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      ) : filteredObligations.length === 0 ? (
        <div className="card">
          <EmptyState
            illustration="/images/illustrations/21.svg"
            illustrationDark="/images/illustrations/21-dark.svg"
            title={searchTerm ? 'Nenhuma obrigacao encontrada' : 'Nenhuma obrigacao cadastrada'}
            description={
              searchTerm
                ? 'Tente ajustar os termos da busca'
                : 'Cadastre sua primeira obrigacao para comecar a gerar tarefas automaticamente'
            }
            action={
              !searchTerm
                ? {
                    label: 'Nova Obrigacao',
                    onClick: handleCreateObligation,
                    icon: Plus,
                  }
                : undefined
            }
          />
        </div>
      ) : (
        /* Obligations Table */
        <div className="card overflow-hidden">
          <div className="table-container border-0">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Obrigacao</th>
                  <th>Tipo</th>
                  <th>Frequencia</th>
                  <th>Prazo</th>
                  <th>Empresas</th>
                  <th>Geracao Auto.</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredObligations.map((obligation) => (
                  <tr key={obligation.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {obligation.title}
                          </p>
                          {obligation.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                              {obligation.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {OBLIGATION_KINDS[obligation.kind]}
                      </span>
                    </td>
                    <td>
                      <Badge className={FREQUENCY_COLORS[obligation.frequency]}>
                        {OBLIGATION_FREQUENCIES[obligation.frequency]}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Dia {obligation.day_deadline}
                        {obligation.month_deadline && (
                          <span> / {obligation.month_deadline}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {obligation.companies_count || 0}
                      </div>
                    </td>
                    <td>
                      {obligation.generate_automatic_tasks ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <Zap className="w-3 h-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditObligation(obligation)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setObligationToGenerate(obligation)}>
                            <Play className="w-4 h-4 mr-2" />
                            Gerar Tarefas
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setObligationToDelete(obligation)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {!isLoading && filteredObligations.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <p>
            Mostrando {filteredObligations.length} de {obligations.length} obrigacoes
            {searchTerm && ` (filtrado por "${searchTerm}")`}
          </p>
        </div>
      )}

      {/* Form Modal */}
      <ObligationFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        obligation={selectedObligation}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!obligationToDelete} onOpenChange={() => setObligationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Obrigacao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a obrigacao{' '}
              <span className="font-semibold">{obligationToDelete?.title}</span>? Esta acao nao
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteObligation}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteObligation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generate Tasks Confirmation */}
      <AlertDialog open={!!obligationToGenerate} onOpenChange={() => setObligationToGenerate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gerar Tarefas</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja gerar tarefas para a obrigacao{' '}
              <span className="font-semibold">{obligationToGenerate?.title}</span>? As tarefas
              serao criadas para todas as empresas vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGenerateTasks}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {generateTasks.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Gerar Tarefas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
