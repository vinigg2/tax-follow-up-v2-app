import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
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
import { useCreateTask } from '@/hooks/useTasks';
import { useCompanies } from '@/hooks/useCompanies';
import { useObligations } from '@/hooks/useObligations';
import { useUsers } from '@/hooks/useUsers';
import { TaskCreateData } from '@/api/tasks';

interface TaskFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskFormDrawer({ open, onOpenChange }: TaskFormDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [obligationId, setObligationId] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [competency, setCompetency] = useState('');

  const createTask = useCreateTask();
  const { data: companiesData } = useCompanies();
  const { data: obligationsData } = useObligations();
  const { data: usersData } = useUsers();

  const companies = companiesData?.companies || [];
  const obligations = obligationsData?.obligations || [];
  const users = usersData?.users || [];

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setCompanyId('');
      setObligationId('');
      setResponsibleUserId('');
      setDeadline('');
      setCompetency('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !companyId || !deadline) {
      toast.error('Preencha os campos obrigatorios');
      return;
    }

    const payload: TaskCreateData = {
      title: title.trim(),
      description: description.trim() || undefined,
      company_id: Number(companyId),
      obligation_id: obligationId ? Number(obligationId) : undefined,
      responsible_user_id: responsibleUserId ? Number(responsibleUserId) : undefined,
      deadline,
      competency: competency.trim() || undefined,
    };

    try {
      await createTask.mutateAsync(payload);
      toast.success('Tarefa criada com sucesso!');
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erro ao criar tarefa');
    }
  };

  const canSubmit = title.trim() && companyId && deadline;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nova Tarefa</SheetTitle>
          <SheetDescription>
            Crie uma nova tarefa manualmente
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit}>
          <SheetBody className="space-y-5">
            {/* Titulo */}
            <div className="space-y-2">
              <Label htmlFor="title">Titulo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: DCTF - Janeiro/2025"
                maxLength={100}
              />
            </div>

            {/* Empresa */}
            <div className="space-y-2">
              <Label htmlFor="company_id">Empresa *</Label>
              <select
                id="company_id"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="input w-full"
              >
                <option value="">Selecione uma empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Modelo de Obrigacao */}
            <div className="space-y-2">
              <Label htmlFor="obligation_id">Modelo de Obrigacao</Label>
              <select
                id="obligation_id"
                value={obligationId}
                onChange={(e) => setObligationId(e.target.value)}
                className="input w-full"
              >
                <option value="">Nenhum (tarefa avulsa)</option>
                {obligations.map((obligation) => (
                  <option key={obligation.id} value={obligation.id}>
                    {obligation.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Opcional. Vincule a um modelo para herdar configuracoes.
              </p>
            </div>

            {/* Responsavel */}
            <div className="space-y-2">
              <Label htmlFor="responsible_user_id">Responsavel</Label>
              <select
                id="responsible_user_id"
                value={responsibleUserId}
                onChange={(e) => setResponsibleUserId(e.target.value)}
                className="input w-full"
              >
                <option value="">Nao atribuido</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline">Data de Vencimento *</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            {/* Competencia */}
            <div className="space-y-2">
              <Label htmlFor="competency">Competencia</Label>
              <Input
                id="competency"
                value={competency}
                onChange={(e) => setCompetency(e.target.value)}
                placeholder="Ex: Janeiro/2025 ou 1T/2025"
              />
              <p className="text-xs text-gray-500">
                Periodo de referencia da tarefa (opcional)
              </p>
            </div>

            {/* Descricao */}
            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Observacoes sobre esta tarefa..."
                rows={3}
                className="input w-full resize-none"
                maxLength={500}
              />
            </div>
          </SheetBody>

          <SheetFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createTask.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTask.isPending || !canSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createTask.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Tarefa
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
