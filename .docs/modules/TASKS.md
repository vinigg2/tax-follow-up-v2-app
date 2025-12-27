# Sistema de Tarefas

## Visao Geral

Tarefas sao instancias de trabalho geradas a partir de obrigacoes ou criadas manualmente. Cada tarefa pertence a uma empresa e pode ter um checklist associado.

## Arquivos

```
resources/js/
├── api/tasks.ts                    # API e tipos
├── hooks/useTasks.ts               # React Query hooks
├── components/tasks/
│   ├── TaskActionsDrawer.tsx       # Drawer de acoes da tarefa
│   └── ChecklistManager.tsx        # Gerenciador de checklist
└── pages/tasks/
    └── TasksIndex.tsx              # Pagina principal
```

## Modelo de Dados

```typescript
interface Task {
  id: number;
  title: string;
  task_hierarchy_title?: string;    // Titulo formatado com hierarquia
  status: TaskStatus;
  description?: string;
  wsd?: string;                     // Codigo WSD
  deadline?: string;
  formatted_deadline?: string;
  days_until?: number;              // Dias ate o vencimento (negativo = atrasado)
  company?: {
    id: number;
    name: string;
  };
  obligation?: {
    id: number;
    title: string;
  };
  responsible_user?: {
    id: number;
    name: string;
    avatar?: string;
  };
  created_at?: string;
  updated_at?: string;
}

type TaskStatus =
  | 'pendente'
  | 'em_andamento'
  | 'concluida'
  | 'cancelada'
  | 'bloqueada';
```

## TaskActionsDrawer

Drawer lateral que exibe detalhes e acoes de uma tarefa.

### Abas

1. **Checklist**: Gerenciador de itens do checklist
2. **Processo**: Visualizacao em fluxograma dos itens
3. **Atividades**: Historico de atividades/comentarios
4. **Outras Info**: Descricao e WSD

### Header
- Titulo da tarefa
- Empresa
- Indicador de atraso
- Responsavel
- Barra de progresso do checklist

### Acoes
- Arquivar tarefa

## Funcionalidades

### Listagem
- Tabela com tarefas
- Filtros: status, empresa, responsavel, periodo
- Indicador visual de atraso
- Ordenacao por prazo

### Visualizacao
- Drawer lateral com detalhes
- Checklist integrado
- Historico de atividades

### Progresso
Calculado automaticamente com base no checklist:
```typescript
const completedCount = checklistItems.filter(
  item => item.status === 'concluido'
).length;
const progressPercentage = (completedCount / totalCount) * 100;
```

## Endpoints API

```
GET    /api/tasks                   # Lista tarefas
POST   /api/tasks                   # Cria tarefa
GET    /api/tasks/:id               # Busca tarefa
PUT    /api/tasks/:id               # Atualiza tarefa
DELETE /api/tasks/:id               # Remove tarefa
PATCH  /api/tasks/:id/status        # Atualiza status
POST   /api/tasks/:id/archive       # Arquiva tarefa
```

## Hooks Disponiveis

```typescript
useTasks(params?)                   // Lista tarefas com filtros
useTask(id)                         // Busca tarefa por ID
useCreateTask()                     // Cria tarefa
useUpdateTask()                     // Atualiza tarefa
useDeleteTask()                     // Remove tarefa
useUpdateTaskStatus()               // Atualiza status
useArchiveTask()                    // Arquiva tarefa
```

## Integracao com Checklist

Ver [CHECKLISTS.md](./CHECKLISTS.md) para detalhes do sistema de checklist.

A integracao acontece em:
1. `TaskActionsDrawer` busca checklists via `useTaskChecklists(task.id)`
2. Renderiza `ChecklistManager` na aba Checklist
3. Calcula progresso com base nos itens concluidos
4. Exibe fluxograma na aba Processo
