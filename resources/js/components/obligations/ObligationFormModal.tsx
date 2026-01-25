import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCreateObligation, useUpdateObligation } from '@/hooks/useObligations';
import {
  Obligation,
  ObligationFormData,
  ObligationKind,
  ObligationFrequency,
  OBLIGATION_KINDS,
  OBLIGATION_FREQUENCIES,
  OBLIGATION_PERIODS,
} from '@/api/obligations';
import { ObligationPreview } from './ObligationPreview';
import { Loader2, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface ObligationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obligation?: Obligation | null;
}

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Marco' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export function ObligationFormModal({
  open,
  onOpenChange,
  obligation,
}: ObligationFormModalProps) {
  const { t } = useTranslation();
  const { groups } = useAuth();
  const [groupId, setGroupId] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<ObligationKind>('obrigacoes_acessorias');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<ObligationFrequency>('MM');
  const [dayDeadline, setDayDeadline] = useState(15);
  const [monthDeadline, setMonthDeadline] = useState(3);
  const [period, setPeriod] = useState(0);
  const [generateAutomatic, setGenerateAutomatic] = useState(false);
  const [monthsAdvanced, setMonthsAdvanced] = useState(1);
  const [initialDate, setInitialDate] = useState('');
  const [finalDate, setFinalDate] = useState('');
  const [showAutoSection, setShowAutoSection] = useState(false);

  const createObligation = useCreateObligation();
  const updateObligation = useUpdateObligation();

  const isEditing = !!obligation;
  const isLoading = createObligation.isPending || updateObligation.isPending;

  useEffect(() => {
    if (obligation) {
      setGroupId(obligation.group_id);
      setTitle(obligation.title);
      setKind(obligation.kind);
      setDescription(obligation.description || '');
      setFrequency(obligation.frequency);
      setDayDeadline(obligation.day_deadline);
      setMonthDeadline(obligation.month_deadline || 3);
      setPeriod(obligation.period);
      setGenerateAutomatic(obligation.generate_automatic_tasks);
      setMonthsAdvanced(obligation.months_advanced || 1);
      setInitialDate(obligation.initial_generation_date || '');
      setFinalDate(obligation.final_generation_date || '');
      setShowAutoSection(obligation.generate_automatic_tasks);
    } else {
      setGroupId(groups[0]?.id || 0);
      setTitle('');
      setKind('obrigacoes_acessorias');
      setDescription('');
      setFrequency('MM');
      setDayDeadline(15);
      setMonthDeadline(3);
      setPeriod(0);
      setGenerateAutomatic(false);
      setMonthsAdvanced(1);
      setInitialDate('');
      setFinalDate('');
      setShowAutoSection(false);
    }
  }, [obligation, open, groups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: ObligationFormData = {
      group_id: groupId,
      title,
      kind,
      description: description || undefined,
      frequency,
      day_deadline: dayDeadline,
      month_deadline: frequency !== 'MM' ? monthDeadline : undefined,
      period,
      generate_automatic_tasks: generateAutomatic,
      months_advanced: generateAutomatic ? monthsAdvanced : undefined,
      initial_generation_date: generateAutomatic && initialDate ? initialDate : undefined,
      final_generation_date: generateAutomatic && finalDate ? finalDate : undefined,
    };

    try {
      if (isEditing && obligation) {
        await updateObligation.mutateAsync({ id: obligation.id, data });
        toast.success(t('toast.obligationUpdated'));
      } else {
        await createObligation.mutateAsync(data);
        toast.success(t('toast.obligationCreated'));
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving obligation:', error);

      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(t('toast.errorSavingObligation'));
      }
    }
  };

  const canSubmit = groupId > 0 && title.trim() && dayDeadline >= 1 && dayDeadline <= 31;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Obrigacao' : 'Nova Obrigacao'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edite as informacoes da obrigacao abaixo.'
              : 'Preencha as informacoes para criar um novo modelo de obrigacao fiscal.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-6">
            {/* INFORMACOES BASICAS */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                Informacoes Basicas
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                {groups.length > 1 && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="group">Grupo *</Label>
                    <select
                      id="group"
                      value={groupId}
                      onChange={(e) => setGroupId(Number(e.target.value))}
                      className="input w-full"
                      disabled={isEditing}
                    >
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="title">Titulo *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: DCTF, EFD-Contribuicoes"
                    maxLength={30}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kind">Tipo de Tarefa *</Label>
                  <select
                    id="kind"
                    value={kind}
                    onChange={(e) => setKind(e.target.value as ObligationKind)}
                    className="input w-full"
                  >
                    {Object.entries(OBLIGATION_KINDS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Notas</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Observacoes sobre esta obrigacao..."
                    rows={3}
                    maxLength={250}
                    className="input w-full resize-none"
                  />
                </div>
              </div>
            </div>

            {/* CONFIGURACAO DE PRAZO */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                Configuracao de Prazo
              </h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequencia *</Label>
                  <select
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as ObligationFrequency)}
                    className="input w-full"
                  >
                    {Object.entries(OBLIGATION_FREQUENCIES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dayDeadline">Dia do Prazo *</Label>
                  <select
                    id="dayDeadline"
                    value={dayDeadline}
                    onChange={(e) => setDayDeadline(Number(e.target.value))}
                    className="input w-full"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                {frequency !== 'MM' && (
                  <div className="space-y-2">
                    <Label htmlFor="monthDeadline">Mes do Prazo *</Label>
                    <select
                      id="monthDeadline"
                      value={monthDeadline}
                      onChange={(e) => setMonthDeadline(Number(e.target.value))}
                      className="input w-full"
                    >
                      {MONTHS.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Exercicio/Competencia *</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(OBLIGATION_PERIODS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPeriod(Number(value))}
                      className={cn(
                        'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
                        period === Number(value)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PRE-VISUALIZACAO */}
            <ObligationPreview
              frequency={frequency}
              dayDeadline={dayDeadline}
              monthDeadline={monthDeadline}
              period={period}
            />

            {/* GERACAO AUTOMATICA */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAutoSection(!showAutoSection)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">Geracao Automatica</span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setGenerateAutomatic(!generateAutomatic);
                      if (!generateAutomatic) setShowAutoSection(true);
                    }}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
                      generateAutomatic ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        generateAutomatic ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </div>
                  {showAutoSection ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {showAutoSection && (
                <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="monthsAdvanced">Meses de Antecedencia</Label>
                      <Input
                        id="monthsAdvanced"
                        type="number"
                        min={1}
                        max={12}
                        value={monthsAdvanced}
                        onChange={(e) => setMonthsAdvanced(Number(e.target.value))}
                        disabled={!generateAutomatic}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="initialDate">Vencimentos a partir de</Label>
                      <Input
                        id="initialDate"
                        type="date"
                        value={initialDate}
                        onChange={(e) => setInitialDate(e.target.value)}
                        disabled={!generateAutomatic}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="finalDate">Data Final para Geracao</Label>
                      <Input
                        id="finalDate"
                        type="date"
                        value={finalDate}
                        onChange={(e) => setFinalDate(e.target.value)}
                        disabled={!generateAutomatic}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Quando ativado, as tarefas serao geradas automaticamente com base na frequencia e nos parametros
                    acima.
                  </p>
                </div>
              )}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !canSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Obrigacao'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
