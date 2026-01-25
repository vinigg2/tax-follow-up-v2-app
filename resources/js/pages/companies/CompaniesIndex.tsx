import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCompanies, useDeleteCompany } from '@/hooks/useCompanies';
import { useAuth } from '@/hooks/useAuth';
import { Company } from '@/api/companies';
import { CompanyFormDrawer } from '@/components/companies/CompanyFormDrawer';
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
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  ListTodo,
  Loader2,
} from 'lucide-react';

export default function CompaniesIndex() {
  const { t } = useTranslation();
  const { groups } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<number | undefined>();

  // Drawer states
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Delete confirmation
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const { data, isLoading, error } = useCompanies({ group_id: groupFilter });
  const deleteCompany = useDeleteCompany();

  const companies = data?.companies || [];

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCompany = () => {
    setSelectedCompany(null);
    setIsFormDrawerOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsFormDrawerOpen(true);
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    try {
      await deleteCompany.mutateAsync(companyToDelete.id);
      toast.success(t('toast.companyDeleted'));
      setCompanyToDelete(null);
    } catch (error: any) {
      console.error('Error deleting company:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(t('toast.errorDeletingCompany'));
      }
    }
  };

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  return (
    <div className="container-fluid space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('companies.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie as empresas e suas informacoes
          </p>
        </div>

        {/* Search and Create Button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar empresas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full sm:w-64"
            />
          </div>
          <Button
            onClick={handleCreateCompany}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nova Empresa</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      {/* Group Filter */}
      {groups.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setGroupFilter(undefined)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              !groupFilter
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {t('common.all')}
          </button>
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setGroupFilter(group.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                groupFilter === group.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              {group.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {error ? (
        <div className="card p-8 text-center">
          <Building2 className="mx-auto w-12 h-12 text-red-500" />
          <p className="mt-4 text-gray-900 dark:text-white font-medium">
            Erro ao carregar empresas
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
      ) : filteredCompanies.length === 0 ? (
        <div className="card">
          <EmptyState
            illustration="/images/illustrations/5.svg"
            illustrationDark="/images/illustrations/5-dark.svg"
            title={searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
            description={
              searchTerm
                ? 'Tente ajustar os termos da busca'
                : 'Cadastre sua primeira empresa para comecar a gerenciar suas obrigacoes fiscais'
            }
            action={
              !searchTerm
                ? {
                    label: 'Cadastrar Empresa',
                    onClick: handleCreateCompany,
                    icon: Plus,
                  }
                : undefined
            }
          />
        </div>
      ) : (
        /* Companies Table */
        <div className="card overflow-hidden">
          <div className="table-container border-0">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>{t('companies.title')}</th>
                  <th>{t('companies.cnpj')}</th>
                  <th>{t('nav.teams')}</th>
                  <th>{t('nav.tasks')}</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredCompanies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {company.name}
                          </p>
                          {company.country && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {company.country}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-gray-600 dark:text-gray-300">
                        {formatCNPJ(company.cnpj) || '-'}
                      </p>
                    </td>
                    <td>
                      {company.group ? (
                        <Badge variant="secondary">
                          <Users className="w-3 h-3 mr-1" />
                          {company.group.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <ListTodo className="w-4 h-4" />
                        <span>{company.tasks_count || 0}</span>
                      </div>
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setCompanyToDelete(company)}
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
      {!isLoading && filteredCompanies.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <p>
            Mostrando {filteredCompanies.length} de {companies.length} empresas
            {searchTerm && ` (filtrado por "${searchTerm}")`}
          </p>
        </div>
      )}

      {/* Form Drawer */}
      <CompanyFormDrawer
        open={isFormDrawerOpen}
        onOpenChange={setIsFormDrawerOpen}
        company={selectedCompany}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!companyToDelete} onOpenChange={() => setCompanyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa{' '}
              <span className="font-semibold">{companyToDelete?.name}</span>? Esta acao
              nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompany}
              className="bg-red-600 hover:bg-red-700"
              variant="destructive"
            >
              {deleteCompany.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
