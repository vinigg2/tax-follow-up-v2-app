import { AlertTriangle, Check, X, FileText, User, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIAction, AIActionType } from '@/types/ai';

interface AIActionConfirmationProps {
  action: AIAction;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Helper to format action data in a user-friendly way
function formatActionDetails(type: AIActionType, data?: Record<string, unknown>): React.ReactNode {
  if (!data) return null;

  const items: { icon: React.ReactNode; label: string; value: string }[] = [];

  switch (type) {
    case 'create_task':
      if (data.title) items.push({ icon: <FileText className="h-3 w-3" />, label: 'Titulo', value: String(data.title) });
      if (data.deadline) items.push({ icon: <Calendar className="h-3 w-3" />, label: 'Prazo', value: formatDate(data.deadline) });
      if (data.company_name || data.company_id) items.push({ icon: <Building2 className="h-3 w-3" />, label: 'Empresa', value: String(data.company_name || `ID: ${data.company_id}`) });
      if (data.responsible_name || data.responsible) items.push({ icon: <User className="h-3 w-3" />, label: 'Responsavel', value: String(data.responsible_name || `ID: ${data.responsible}`) });
      break;

    case 'update_task':
      if (data.task_id) items.push({ icon: <FileText className="h-3 w-3" />, label: 'Tarefa', value: String(data.task_name || `#${data.task_id}`) });
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'task_id' && key !== 'task_name' && value !== undefined) {
          items.push({ icon: null, label: formatFieldName(key), value: formatValue(key, value) });
        }
      });
      break;

    case 'assign_responsible':
      if (data.task_ids && Array.isArray(data.task_ids)) {
        items.push({ icon: <FileText className="h-3 w-3" />, label: 'Tarefas', value: `${data.task_ids.length} tarefa(s) selecionada(s)` });
      } else if (data.task_id) {
        items.push({ icon: <FileText className="h-3 w-3" />, label: 'Tarefa', value: String(data.task_name || `#${data.task_id}`) });
      }
      if (data.user_name || data.user_id) {
        items.push({ icon: <User className="h-3 w-3" />, label: 'Novo responsavel', value: String(data.user_name || `ID: ${data.user_id}`) });
      }
      break;

    case 'change_status':
      if (data.task_id) items.push({ icon: <FileText className="h-3 w-3" />, label: 'Tarefa', value: String(data.task_name || `#${data.task_id}`) });
      if (data.status) items.push({ icon: null, label: 'Novo status', value: formatStatus(String(data.status)) });
      break;

    case 'create_obligation':
      if (data.title) items.push({ icon: <FileText className="h-3 w-3" />, label: 'Titulo', value: String(data.title) });
      if (data.frequency) items.push({ icon: <Calendar className="h-3 w-3" />, label: 'Frequencia', value: formatFrequency(String(data.frequency)) });
      if (data.day_deadline) items.push({ icon: null, label: 'Dia do vencimento', value: `Dia ${data.day_deadline}` });
      break;

    case 'create_checklist':
      if (data.task_id) items.push({ icon: <FileText className="h-3 w-3" />, label: 'Tarefa', value: String(data.task_name || `#${data.task_id}`) });
      if (data.title) items.push({ icon: null, label: 'Item', value: String(data.title) });
      break;

    case 'navigate':
      if (data.path) items.push({ icon: null, label: 'Destino', value: String(data.path) });
      break;

    default:
      // For unknown types, show a simple summary
      return (
        <p className="text-xs text-muted-foreground mt-1">
          {Object.keys(data).length} parametro(s) definido(s)
        </p>
      );
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
          <span className="text-muted-foreground">{item.label}:</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function formatDate(value: unknown): string {
  if (!value) return '';
  try {
    const date = new Date(String(value));
    return date.toLocaleDateString('pt-BR');
  } catch {
    return String(value);
  }
}

function formatFieldName(key: string): string {
  const names: Record<string, string> = {
    title: 'Titulo',
    description: 'Descricao',
    deadline: 'Prazo',
    status: 'Status',
    responsible: 'Responsavel',
    company_id: 'Empresa',
  };
  return names[key] || key.replace(/_/g, ' ');
}

function formatValue(key: string, value: unknown): string {
  if (key === 'deadline') return formatDate(value);
  if (key === 'status') return formatStatus(String(value));
  return String(value);
}

function formatStatus(status: string): string {
  const statuses: Record<string, string> = {
    new: 'Nova',
    pending: 'Em andamento',
    late: 'Atrasada',
    finished: 'Concluida',
    archived: 'Arquivada',
  };
  return statuses[status] || status;
}

function formatFrequency(freq: string): string {
  const frequencies: Record<string, string> = {
    MM: 'Mensal',
    QT: 'Trimestral',
    AA: 'Anual',
  };
  return frequencies[freq] || freq;
}

export function AIActionConfirmation({
  action,
  onConfirm,
  onCancel,
  isLoading = false,
}: AIActionConfirmationProps) {
  return (
    <div className="mx-4 mb-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-amber-700 dark:text-amber-500">
            Confirmar acao
          </h4>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            {action.description}
          </p>

          {/* Action details - formatted nicely */}
          {formatActionDetails(action.type, action.data)}

          {/* Buttons */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-1" />
              {isLoading ? 'Executando...' : 'Confirmar'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
