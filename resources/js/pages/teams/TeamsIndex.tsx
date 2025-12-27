import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTeams, useDeleteTeam } from '@/hooks/useTeams';
import { Team } from '@/api/teams';
import { TeamFormDrawer } from '@/components/teams/TeamFormDrawer';
import { TeamMembersDrawer } from '@/components/teams/TeamMembersDrawer';
import { TeamCompaniesDrawer } from '@/components/teams/TeamCompaniesDrawer';
import { Button } from '@/components/ui/button';
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
  Users,
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  Link2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TeamsIndex() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  // Drawer states
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [isMembersDrawerOpen, setIsMembersDrawerOpen] = useState(false);
  const [isCompaniesDrawerOpen, setIsCompaniesDrawerOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Delete confirmation
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const { data, isLoading, error } = useTeams();
  const deleteTeam = useDeleteTeam();

  const teams = data?.teams || [];

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTeam = () => {
    setSelectedTeam(null);
    setIsFormDrawerOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsFormDrawerOpen(true);
  };

  const handleManageMembers = (team: Team) => {
    setSelectedTeam(team);
    setIsMembersDrawerOpen(true);
  };

  const handleManageCompanies = (team: Team) => {
    setSelectedTeam(team);
    setIsCompaniesDrawerOpen(true);
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      await deleteTeam.mutateAsync(teamToDelete.id);
      setTeamToDelete(null);
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  return (
    <div className="container-fluid space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('teams.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie suas equipes, membros e empresas vinculadas
          </p>
        </div>

        {/* Search and Create Button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar equipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full sm:w-64"
            />
          </div>
          <Button
            onClick={handleCreateTeam}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nova Equipe</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="card p-8 text-center">
          <Users className="mx-auto w-12 h-12 text-red-500" />
          <p className="mt-4 text-gray-900 dark:text-white font-medium">
            Erro ao carregar equipes
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tente novamente mais tarde
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="card">
          <EmptyState
            illustration="/images/illustrations/32.svg"
            illustrationDark="/images/illustrations/32-dark.svg"
            title={searchTerm ? 'Nenhuma equipe encontrada' : 'Nenhuma equipe cadastrada'}
            description={
              searchTerm
                ? 'Tente ajustar os termos da busca'
                : 'Crie sua primeira equipe para comecar a organizar seus membros e empresas'
            }
            action={
              !searchTerm
                ? {
                    label: 'Criar Equipe',
                    onClick: handleCreateTeam,
                    icon: Plus,
                  }
                : undefined
            }
          />
        </div>
      ) : (
        /* Teams Grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="card p-5 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {team.name}
                    </h3>
                    {team.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                        {team.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditTeam(team)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleManageMembers(team)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Gerenciar Membros
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleManageCompanies(team)}>
                      <Link2 className="w-4 h-4 mr-2" />
                      Vincular Empresas
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setTeamToDelete(team)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {team.members_count || team.members?.length || 0} membros
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {team.companies_count || team.companies?.length || 0} empresas
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleManageMembers(team)}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Membros
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleManageCompanies(team)}
                >
                  <Link2 className="w-4 h-4 mr-1" />
                  Empresas
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!isLoading && filteredTeams.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <p>
            Mostrando {filteredTeams.length} de {teams.length} equipes
            {searchTerm && ` (filtrado por "${searchTerm}")`}
          </p>
        </div>
      )}

      {/* Drawers */}
      <TeamFormDrawer
        open={isFormDrawerOpen}
        onOpenChange={setIsFormDrawerOpen}
        team={selectedTeam}
      />

      <TeamMembersDrawer
        open={isMembersDrawerOpen}
        onOpenChange={setIsMembersDrawerOpen}
        team={selectedTeam}
      />

      <TeamCompaniesDrawer
        open={isCompaniesDrawerOpen}
        onOpenChange={setIsCompaniesDrawerOpen}
        team={selectedTeam}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!teamToDelete} onOpenChange={() => setTeamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Equipe</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a equipe{' '}
              <span className="font-semibold">{teamToDelete?.name}</span>? Esta acao
              nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              className="bg-red-600 hover:bg-red-700"
              variant="destructive"
            >
              {deleteTeam.isPending && (
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
