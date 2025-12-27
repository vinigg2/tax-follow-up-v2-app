import { useState } from 'react';
import {
  useTaskChecklists,
  useCreateChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
  useUpdateChecklistStatus,
} from '@/hooks/useChecklists';
import { ChecklistItem, ChecklistStatus, CHECKLIST_STATUSES } from '@/api/checklists';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  Lock,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistManagerProps {
  taskId: number | string;
  readOnly?: boolean;
}

const STATUS_ICONS: Record<ChecklistStatus, React.ReactNode> = {
  pendente: <Circle className="w-4 h-4 text-gray-400" />,
  em_andamento: <Clock className="w-4 h-4 text-blue-500" />,
  concluido: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  cancelado: <XCircle className="w-4 h-4 text-red-500" />,
  bloqueado: <Lock className="w-4 h-4 text-amber-500" />,
};

export function ChecklistManager({ taskId, readOnly = false }: ChecklistManagerProps) {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [itemToDelete, setItemToDelete] = useState<ChecklistItem | null>(null);

  const { data, isLoading } = useTaskChecklists(taskId);
  const createItem = useCreateChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();
  const updateStatus = useUpdateChecklistStatus();

  const items = data?.checklists || [];
  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  // Calculate progress
  const completedCount = items.filter((item) => item.status === 'concluido').length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    try {
      await createItem.mutateAsync({
        taskId,
        data: {
          title: newItemTitle.trim(),
          status: 'pendente',
          order: items.length,
        },
      });
      setNewItemTitle('');
    } catch (error) {
      console.error('Error creating checklist item:', error);
    }
  };

  const handleStartEdit = (item: ChecklistItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editTitle.trim()) return;

    try {
      await updateItem.mutateAsync({
        id: editingItem.id,
        data: { title: editTitle.trim() },
      });
      setEditingItem(null);
      setEditTitle('');
    } catch (error) {
      console.error('Error updating checklist item:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditTitle('');
  };

  const handleStatusChange = async (item: ChecklistItem, newStatus: ChecklistStatus) => {
    try {
      await updateStatus.mutateAsync({ id: item.id, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteItem.mutateAsync(itemToDelete.id);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting checklist item:', error);
    }
  };

  const handleToggleComplete = async (item: ChecklistItem) => {
    const newStatus = item.status === 'concluido' ? 'pendente' : 'concluido';
    await handleStatusChange(item, newStatus);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {completedCount} de {totalCount} concluidos
            </span>
            <span className="font-medium text-gray-900 dark:text-white">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Checklist Items */}
      <div className="space-y-2">
        {sortedItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              'group flex items-center gap-3 p-3 rounded-lg border transition-colors',
              item.status === 'concluido'
                ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                : item.status === 'bloqueado'
                  ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800'
                  : item.status === 'cancelado'
                    ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
                    : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
            )}
          >
            {/* Drag Handle */}
            {!readOnly && (
              <GripVertical className="w-4 h-4 text-gray-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
            )}

            {/* Status Toggle */}
            <button
              onClick={() => !readOnly && handleToggleComplete(item)}
              disabled={readOnly || item.status === 'bloqueado' || item.status === 'cancelado'}
              className={cn(
                'flex-shrink-0 transition-transform',
                !readOnly && 'hover:scale-110',
                (item.status === 'bloqueado' || item.status === 'cancelado') && 'cursor-not-allowed'
              )}
            >
              {STATUS_ICONS[item.status]}
            </button>

            {/* Title */}
            {editingItem?.id === item.id ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  className="flex-1"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveEdit} disabled={updateItem.isPending}>
                  {updateItem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <span
                className={cn(
                  'flex-1 text-sm',
                  item.status === 'concluido' && 'line-through text-gray-500 dark:text-gray-400',
                  item.status === 'cancelado' && 'line-through text-red-500 dark:text-red-400'
                )}
              >
                {item.title}
              </span>
            )}

            {/* Status Badge (for non-pendente/concluido) */}
            {item.status !== 'pendente' && item.status !== 'concluido' && !editingItem && (
              <Badge className={CHECKLIST_STATUSES[item.status].color}>
                {CHECKLIST_STATUSES[item.status].label}
              </Badge>
            )}

            {/* Actions */}
            {!readOnly && !editingItem && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStartEdit(item)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {Object.entries(CHECKLIST_STATUSES).map(([status, config]) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => handleStatusChange(item, status as ChecklistStatus)}
                      disabled={item.status === status}
                    >
                      {STATUS_ICONS[status as ChecklistStatus]}
                      <span className="ml-2">{config.label}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setItemToDelete(item)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum item no checklist</p>
          {!readOnly && <p className="text-xs mt-1">Adicione itens para acompanhar o progresso</p>}
        </div>
      )}

      {/* Add New Item */}
      {!readOnly && (
        <form onSubmit={handleAddItem} className="flex items-center gap-2">
          <Input
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Adicionar novo item..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newItemTitle.trim() || createItem.isPending}>
            {createItem.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </form>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Item</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o item{' '}
              <span className="font-semibold">"{itemToDelete?.title}"</span>? Esta acao nao pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {deleteItem.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
