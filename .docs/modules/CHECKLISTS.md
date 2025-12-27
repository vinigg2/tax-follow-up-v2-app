# Sistema de Checklist

## Visao Geral

Checklists sao listas de subtarefas vinculadas a uma tarefa. Cada item possui um status independente e contribui para o progresso geral da tarefa.

## Arquivos

```
resources/js/
├── api/checklists.ts                # API e tipos
├── hooks/useChecklists.ts           # React Query hooks
└── components/tasks/
    └── ChecklistManager.tsx         # Componente principal
```

## Modelo de Dados

```typescript
type ChecklistStatus =
  | 'pendente'
  | 'em_andamento'
  | 'concluido'
  | 'cancelado'
  | 'bloqueado';

interface ChecklistItem {
  id: number;
  task_id: number;
  title: string;
  description?: string;
  status: ChecklistStatus;
  order: number;                    // Ordem de exibicao
  created_at?: string;
  updated_at?: string;
}
```

## Status e Icones

| Status | Label | Icone | Cor |
|--------|-------|-------|-----|
| `pendente` | Pendente | Circle | gray |
| `em_andamento` | Em Andamento | Clock | blue |
| `concluido` | Concluido | CheckCircle2 | green |
| `cancelado` | Cancelado | XCircle | red |
| `bloqueado` | Bloqueado | Lock | amber |

## ChecklistManager Component

### Props

```typescript
interface ChecklistManagerProps {
  taskId: number | string;
  readOnly?: boolean;              // Desabilita edicao
}
```

### Funcionalidades

1. **Barra de Progresso**
   - Mostra X de Y concluidos
   - Porcentagem visual

2. **Lista de Itens**
   - Icone de status
   - Titulo do item
   - Badge para status especiais
   - Menu de acoes (hover)

3. **Acoes por Item**
   - Toggle concluido (clique no icone)
   - Editar titulo (inline)
   - Alterar status (dropdown)
   - Excluir (com confirmacao)

4. **Adicionar Item**
   - Input no rodape
   - Adiciona com status "pendente"

### Estados Visuais

```typescript
// Cores de fundo por status
'concluido' → 'bg-green-50 border-green-200'
'bloqueado' → 'bg-amber-50 border-amber-200'
'cancelado' → 'bg-red-50 border-red-200'
default     → 'bg-white border-gray-200'
```

## Endpoints API

```
GET    /api/tasks/:taskId/checklists           # Lista itens
POST   /api/tasks/:taskId/checklists           # Cria item
PUT    /api/checklists/:id                      # Atualiza item
DELETE /api/checklists/:id                      # Remove item
PATCH  /api/checklists/:id/status              # Atualiza status
PATCH  /api/tasks/:taskId/checklists/reorder   # Reordena itens
```

## Hooks Disponiveis

```typescript
useTaskChecklists(taskId)           // Lista itens de uma tarefa
useCreateChecklistItem()            // Cria item
useUpdateChecklistItem()            // Atualiza item
useDeleteChecklistItem()            // Remove item
useUpdateChecklistStatus()          // Atualiza status
useReorderChecklists()              // Reordena itens
```

## Uso no TaskActionsDrawer

```typescript
// 1. Busca dados
const { data: checklistData } = useTaskChecklists(task.id);
const checklistItems = checklistData?.checklists || [];

// 2. Calcula progresso
const completedCount = checklistItems.filter(
  item => item.status === 'concluido'
).length;
const totalCount = checklistItems.length;
const progressPercentage = totalCount > 0
  ? (completedCount / totalCount) * 100
  : 0;

// 3. Renderiza na aba Checklist
<ChecklistManager taskId={task.id} />

// 4. Usa na aba Processo (fluxograma)
{checklistItems.map((item, index) => (
  // Renderiza passo do fluxograma
))}
```

## Drag and Drop (Futuro)

O componente ja possui o icone `GripVertical` preparado para reordenacao.
A implementacao de drag-and-drop pode usar:
- `@dnd-kit/core`
- `react-beautiful-dnd`
- `@hello-pangea/dnd`

O endpoint `reorder` ja existe na API.
