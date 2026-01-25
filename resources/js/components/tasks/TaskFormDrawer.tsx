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
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { useCompanies } from '@/hooks/useCompanies';
import { useObligations } from '@/hooks/useObligations';
import { useUsers } from '@/hooks/useUsers';
import { Task, TaskCreateData } from '@/api/tasks';

interface TaskFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
}

export function TaskFormDrawer({ open, onOpenChange, task }: TaskFormDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [obligationId, setObligationId] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [competency, setCompetency] = useState('');

  const isEditMode = !!task;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: companiesData } = useCompanies();
  const { data: obligationsData } = useObligations();
  const { data: usersData } = useUsers();

  const companies = companiesData?.companies || [];
  const obligations = obligationsData?.obligations || [];
  const users = usersData?.users || [];

  // Initialize form when drawer opens
  useEffect(() => {
    if (open) {
      if (task) {
        // Edit mode: pre-fill form with task data
        setTitle(task.task_hierarchy_title || task.title || '');
        setDescription(task.description || '');
        setCompanyId(task.company?.id?.toString() || '');
        setResponsibleUserId(task.responsible_user?.id?.toString() || '');
        // Convert ISO date to YYYY-MM-DD for input type="date"
        const deadlineDate = task.deadline ? task.deadline.split('T')[0] : '';
        setDeadline(deadlineDate);
        setCompetency(task.competency || '');
        setObligationId('');
      } else {
        // Create mode: reset form
        setTitle('');
        setDescription('');
        setCompanyId('');
        setObligationId('');
        setResponsibleUserId('');
        setDeadline('');
        setCompetency('');
      }
    }
  }, [open, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !companyId || !deadline) {
      toast.error('Preencha os campos obrigatorios');
      return;
    }

    try {
      if (isEditMode && task) {
        // Edit mode
        const updateData = {
          title: title.trim(),
          description: description.trim() || null,
          company_id: Number(companyId),
          responsible_user_id: responsibleUserId ? Number(responsibleUserId) : null,
          deadline,
          competency: competency.trim() || null,
        };
        await updateTask.mutateAsync({ id: task.id, data: updateData });
        toast.success('Tarefa atualizada com sucesso!');
      } else {
        // Create mode
        const selectedCompany = companies.find(c => c.id === Number(companyId));
        if (!selectedCompany?.group_id) {
          toast.error('Empresa sem grupo associado');
          return;
        }

        const payload: TaskCreateData = {
          title: title.trim(),
          description: description.trim() || undefined,
          company_id: Number(companyId),
          group_id: selectedCompany.group_id,
          obligation_id: obligationId ? Number(obligationId) : undefined,
          responsible_user_id: responsibleUserId ? Number(responsibleUserId) : undefined,
          deadline,
          competency: competency.trim() || undefined,
        };
        await createTask.mutateAsync(payload);
        toast.success('Tarefa criada com sucesso!');
      }
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || (isEditMode ? 'Erro ao atualizar tarefa' : 'Erro ao criar tarefa'));
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;
  const canSubmit = title.trim() && companyId && deadline;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? 'Editar Tarefa' : 'Nova Tarefa'}</SheetTitle>
          <SheetDescription>
            {isEditMode ? 'Atualize os dados da tarefa' : 'Crie uma nova tarefa manualmente'}
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

            {/* Modelo de Obrigacao - only show in create mode */}
            {!isEditMode && (
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
            )}

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
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !canSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditMode ? 'Salvar Alteracoes' : 'Criar Tarefa'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
