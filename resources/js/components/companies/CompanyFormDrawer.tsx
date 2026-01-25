import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCreateCompany, useUpdateCompany } from '@/hooks/useCompanies';
import { useAuth } from '@/hooks/useAuth';
import { Company } from '@/api/companies';
import { Loader2 } from 'lucide-react';

interface CompanyFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
}

export function CompanyFormDrawer({ open, onOpenChange, company }: CompanyFormDrawerProps) {
  const { t } = useTranslation();
  const { groups, isAdmin, isOwner } = useAuth();
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [country, setCountry] = useState('BR');
  const [groupId, setGroupId] = useState<number | undefined>();

  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  // Pegar grupos onde o usuario eh admin/owner
  const adminGroups = groups.filter(g => isAdmin(g.id) || isOwner(g.id));
  const isEditing = !!company;
  const isLoading = createCompany.isPending || updateCompany.isPending;

  useEffect(() => {
    if (company) {
      setName(company.name);
      setCnpj(company.cnpj || '');
      setCountry(company.country || 'BR');
      setGroupId(company.group_id);
    } else {
      setName('');
      setCnpj('');
      setCountry('BR');
      // Se houver apenas um grupo admin, seleciona automaticamente
      setGroupId(adminGroups.length === 1 ? adminGroups[0].id : undefined);
    }
  }, [company, open]);

  const formatCNPJ = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    // Format as XX.XXX.XXX/XXXX-XX
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setCnpj(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name,
      cnpj: cnpj.replace(/\D/g, ''),
      country,
      group_id: groupId,
    };

    try {
      if (isEditing && company) {
        await updateCompany.mutateAsync({ id: company.id, data });
        toast.success(t('toast.companyUpdated'));
      } else {
        await createCompany.mutateAsync(data);
        toast.success(t('toast.companyCreated'));
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving company:', error);
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(t('toast.errorSavingCompany'));
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Empresa' : 'Nova Empresa'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Edite as informacoes da empresa abaixo.'
              : 'Preencha as informacoes para cadastrar uma nova empresa.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit}>
          <SheetBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Empresa</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Empresa ABC Ltda"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">{t('companies.cnpj')} *</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={handleCNPJChange}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{t('companies.country')}</Label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input w-full"
                required
              >
                <option value="BR">Brasil</option>
                <option value="US">Estados Unidos</option>
                <option value="PT">Portugal</option>
                <option value="AR">Argentina</option>
                <option value="CL">Chile</option>
                <option value="CO">Colombia</option>
                <option value="MX">Mexico</option>
                <option value="UY">Uruguai</option>
                <option value="PY">Paraguai</option>
              </select>
            </div>

            {adminGroups.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="group">{t('nav.teams')}</Label>
                <select
                  id="group"
                  value={groupId || ''}
                  onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : undefined)}
                  className="input w-full"
                  required
                >
                  <option value="">{t('common.select')}</option>
                  {adminGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </SheetBody>

          <SheetFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim() || !cnpj.trim() || !groupId}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? t('common.save') : t('common.create')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
