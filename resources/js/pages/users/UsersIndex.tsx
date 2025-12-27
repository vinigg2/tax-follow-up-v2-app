import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUsers, useDeleteUser, useToggleUserActive } from '@/hooks/useUsers';
import { useTeams } from '@/hooks/useTeams';
import { User } from '@/api/users';
import { UserFormDrawer } from '@/components/users/UserFormDrawer';
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
  UserCircle,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Loader2,
  Shield,
  ShieldOff,
  Mail,
  Phone,
} from 'lucide-react';

export default function UsersIndex() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState<number | undefined>();

  // Drawer states
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Delete confirmation
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { data, isLoading, error } = useUsers({ team_id: teamFilter });
  const { data: teamsData } = useTeams();
  const deleteUser = useDeleteUser();
  const toggleActive = useToggleUserActive();

  const users = data?.users || [];
  const teams = teamsData?.teams || [];

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cpf?.includes(searchTerm.replace(/\D/g, '')) ||
      user.phone?.includes(searchTerm)
  );

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsFormDrawerOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormDrawerOpen(true);
  };

  const handleToggleActive = async (user: User) => {
    try {
      await toggleActive.mutateAsync(user.id);
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser.mutateAsync(userToDelete.id);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const formatCPF = (cpf?: string) => {
    if (!cpf) return '';
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return cpf;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="container-fluid space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie os usuarios do sistema e suas permissoes
          </p>
        </div>

        {/* Search and Create Button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full sm:w-64"
            />
          </div>
          <Button
            onClick={handleCreateUser}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Novo Usuario</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Team Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setTeamFilter(undefined)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
            !teamFilter
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
          }`}
        >
          <UserCircle className="w-4 h-4" />
          Todos
        </button>
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => setTeamFilter(team.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              teamFilter === team.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            {team.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {error ? (
        <div className="card p-8 text-center">
          <UserCircle className="mx-auto w-12 h-12 text-red-500" />
          <p className="mt-4 text-gray-900 dark:text-white font-medium">
            Erro ao carregar usuarios
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
      ) : filteredUsers.length === 0 ? (
        <div className="card">
          <EmptyState
            illustration="/images/illustrations/29.svg"
            illustrationDark="/images/illustrations/29-dark.svg"
            title={searchTerm ? 'Nenhum usuario encontrado' : 'Nenhum usuario cadastrado'}
            description={
              searchTerm
                ? 'Tente ajustar os termos da busca'
                : 'Cadastre o primeiro usuario para comecar a gerenciar o acesso ao sistema'
            }
            action={
              !searchTerm
                ? {
                    label: 'Cadastrar Usuario',
                    onClick: handleCreateUser,
                    icon: Plus,
                  }
                : undefined
            }
          />
        </div>
      ) : (
        /* Users Table */
        <div className="card overflow-hidden">
          <div className="table-container border-0">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Usuario</th>
                  <th>CPF</th>
                  <th>Contato</th>
                  <th>Equipe</th>
                  <th>Status</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <UserCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-gray-600 dark:text-gray-300">
                        {formatCPF(user.cpf) || '-'}
                      </p>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {formatPhone(user.phone)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {user.team ? (
                        <Badge variant="secondary">
                          <Users className="w-3 h-3 mr-1" />
                          {user.team.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">Sem equipe</span>
                      )}
                    </td>
                    <td>
                      <Badge
                        variant={user.is_active !== false ? 'primary' : 'secondary'}
                        className={
                          user.is_active !== false
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }
                      >
                        {user.is_active !== false ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                            {user.is_active !== false ? (
                              <>
                                <ShieldOff className="w-4 h-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setUserToDelete(user)}
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
      {!isLoading && filteredUsers.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <p>
            Mostrando {filteredUsers.length} de {users.length} usuarios
            {searchTerm && ` (filtrado por "${searchTerm}")`}
          </p>
        </div>
      )}

      {/* Form Drawer */}
      <UserFormDrawer
        open={isFormDrawerOpen}
        onOpenChange={setIsFormDrawerOpen}
        user={selectedUser}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuario{' '}
              <span className="font-semibold">{userToDelete?.name}</span>? Esta acao
              nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUser.isPending && (
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
