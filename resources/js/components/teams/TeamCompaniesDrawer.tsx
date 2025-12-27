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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useTeamCompanies,
  useAvailableCompanies,
  useLinkCompanyToTeam,
  useUnlinkCompanyFromTeam,
} from '@/hooks/useTeams';
import { Team, Company } from '@/api/teams';
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
  Building2,
  Plus,
  Minus,
  Search,
  Loader2,
  Link2,
  Unlink,
} from 'lucide-react';

interface TeamCompaniesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

export function TeamCompaniesDrawer({ open, onOpenChange, team }: TeamCompaniesDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCompanies, setShowAddCompanies] = useState(false);
  const [companyToUnlink, setCompanyToUnlink] = useState<Company | null>(null);

  const { data: companiesData, isLoading: loadingCompanies } = useTeamCompanies(team?.id);
  const { data: availableCompaniesData, isLoading: loadingAvailable } = useAvailableCompanies();
  const linkCompany = useLinkCompanyToTeam();
  const unlinkCompany = useUnlinkCompanyFromTeam();

  const companies = companiesData?.companies || [];
  const availableCompanies = availableCompaniesData?.companies || [];

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAvailableCompanies = availableCompanies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLinkCompany = async (companyId: number) => {
    if (!team) return;
    try {
      await linkCompany.mutateAsync({ teamId: team.id, companyId });
    } catch (error) {
      console.error('Error linking company:', error);
    }
  };

  const handleUnlinkCompany = async () => {
    if (!team || !companyToUnlink) return;
    try {
      await unlinkCompany.mutateAsync({ teamId: team.id, companyId: companyToUnlink.id });
      setCompanyToUnlink(null);
    } catch (error) {
      console.error('Error unlinking company:', error);
    }
  };

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return '';
    // Format as XX.XXX.XXX/XXXX-XX
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Empresas Vinculadas
            </SheetTitle>
            <SheetDescription>
              {team?.name} - {companies.length} empresa(s)
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
                variant={showAddCompanies ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowAddCompanies(!showAddCompanies)}
              >
                <Link2 className="w-4 h-4 mr-1" />
                Vincular
              </Button>
            </div>
          </div>

          <SheetBody className="flex-1 overflow-hidden px-0">
            <ScrollArea className="h-full px-6">
              {showAddCompanies ? (
                /* Available Companies List */
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Empresas Disponiveis
                  </h3>
                  {loadingAvailable ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredAvailableCompanies.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma empresa disponivel</p>
                    </div>
                  ) : (
                    filteredAvailableCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {company.name}
                            </p>
                            {company.cnpj && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatCNPJ(company.cnpj)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleLinkCompany(company.id)}
                          disabled={linkCompany.isPending}
                        >
                          {linkCompany.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Linked Companies List */
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Empresas Vinculadas
                  </h3>
                  {loadingCompanies ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredCompanies.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>
                        {searchTerm
                          ? 'Nenhuma empresa encontrada'
                          : 'Nenhuma empresa vinculada'}
                      </p>
                      {!searchTerm && (
                        <Button
                          variant="link"
                          className="mt-2"
                          onClick={() => setShowAddCompanies(true)}
                        >
                          Vincular empresas
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {company.name}
                            </p>
                            {company.cnpj && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatCNPJ(company.cnpj)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => setCompanyToUnlink(company)}
                        >
                          <Unlink className="w-4 h-4" />
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

      {/* Unlink Company Confirmation */}
      <AlertDialog open={!!companyToUnlink} onOpenChange={() => setCompanyToUnlink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desvincular{' '}
              <span className="font-semibold">{companyToUnlink?.name}</span> da equipe{' '}
              <span className="font-semibold">{team?.name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkCompany}
              className="bg-red-600 hover:bg-red-700"
              variant="destructive"
            >
              {unlinkCompany.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
