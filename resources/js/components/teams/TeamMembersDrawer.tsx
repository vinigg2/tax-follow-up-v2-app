import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useTeamMembers,
  useAvailableUsers,
  useAddTeamMember,
  useRemoveTeamMember,
} from '@/hooks/useTeams';
import { Team, User } from '@/api/teams';
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
  Users,
  UserPlus,
  UserMinus,
  Search,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamMembersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

export function TeamMembersDrawer({ open, onOpenChange, team }: TeamMembersDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<User | null>(null);

  const { data: membersData, isLoading: loadingMembers } = useTeamMembers(team?.id);
  const { data: availableUsersData, isLoading: loadingAvailable } = useAvailableUsers();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();

  const members = membersData?.members || [];
  const availableUsers = availableUsersData?.users || [];

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter out users who are already members
  const memberIds = new Set(members.map((m) => m.id));
  const filteredAvailableUsers = availableUsers
    .filter((user) => !memberIds.has(user.id))
    .filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleAddMember = async (userId: number) => {
    if (!team) return;
    try {
      await addMember.mutateAsync({ teamId: team.id, userId });
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleRemoveMember = async () => {
    if (!team || !memberToRemove) return;
    try {
      await removeMember.mutateAsync({ teamId: team.id, userId: memberToRemove.id });
      setMemberToRemove(null);
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Membros da Equipe
            </SheetTitle>
            <SheetDescription>
              {team?.name} - {members.length} membro(s)
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 pb-4">
            {/* Search and Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-9 w-full"
                />
              </div>
              <Button
                variant={showAddMembers ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowAddMembers(!showAddMembers)}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>

          <SheetBody className="flex-1 overflow-hidden px-0">
            <ScrollArea className="h-full px-6">
              {showAddMembers ? (
                /* Available Users List */
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Usuarios Disponiveis
                  </h3>
                  {loadingAvailable ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredAvailableUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>Nenhum usuario disponivel</p>
                    </div>
                  ) : (
                    filteredAvailableUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddMember(user.id)}
                          disabled={addMember.isPending}
                        >
                          {addMember.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Current Members List */
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Membros Atuais
                  </h3>
                  {loadingMembers ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>
                        {searchTerm
                          ? 'Nenhum membro encontrado'
                          : 'Nenhum membro na equipe'}
                      </p>
                      {!searchTerm && (
                        <Button
                          variant="link"
                          className="mt-2"
                          onClick={() => setShowAddMembers(true)}
                        >
                          Adicionar membros
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg group"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {member.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {member.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => setMemberToRemove(member)}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{' '}
              <span className="font-semibold">{memberToRemove?.name}</span> da equipe{' '}
              <span className="font-semibold">{team?.name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-red-600 hover:bg-red-700"
              variant="destructive"
            >
              {removeMember.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
