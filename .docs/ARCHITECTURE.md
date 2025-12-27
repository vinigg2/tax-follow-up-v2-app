# Arquitetura Frontend

## Visao Geral

O frontend segue uma arquitetura em camadas, separando responsabilidades de forma clara.

## Camadas

### 1. API Layer (`resources/js/api/`)

Responsavel por definir tipos e fazer chamadas HTTP.

```typescript
// Exemplo: api/users.ts
export interface User {
  id: number;
  name: string;
  email: string;
  // ...
}

export const usersApi = {
  getAll: async (): Promise<UsersResponse> => {
    const response = await api.get('/users');
    return response.data;
  },
  // ...
};
```

### 2. Hooks Layer (`resources/js/hooks/`)

React Query hooks para gerenciamento de estado do servidor.

```typescript
// Exemplo: hooks/useUsers.ts
export function useUsers() {
  return useQuery<UsersResponse>({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserFormData) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

### 3. Components Layer (`resources/js/components/`)

Componentes React reutilizaveis.

#### Componentes UI (`components/ui/`)
Componentes base do Shadcn/ui:
- Button, Input, Badge, Card
- Dialog, Sheet, AlertDialog
- DropdownMenu, Select
- Tabs, Progress
- Avatar, Skeleton

#### Componentes de Modulo
Organizados por feature:
- `components/tasks/` - TaskActionsDrawer, ChecklistManager
- `components/users/` - UserFormDrawer
- `components/obligations/` - ObligationFormModal, ObligationPreview

### 4. Pages Layer (`resources/js/pages/`)

Paginas completas que compoem a aplicacao.

```
pages/
├── dashboard/
│   └── DashboardIndex.tsx
├── tasks/
│   └── TasksIndex.tsx
├── users/
│   └── UsersIndex.tsx
├── teams/
│   └── TeamsIndex.tsx
├── companies/
│   └── CompaniesIndex.tsx
├── obligations/
│   └── ObligationsIndex.tsx
└── errors/
    ├── NotFound.tsx
    └── ServerError.tsx
```

## Padroes de UI

### Formularios
- **Drawer (Sheet)**: Usado para formularios de criacao/edicao
- **Modal (Dialog)**: Usado para formularios mais complexos ou com preview
- **Inline**: Usado para edicao rapida (ex: checklist items)

### Listagens
- Tabelas responsivas com classe `.table-container`
- Filtros na parte superior
- Acoes em dropdown no final de cada linha
- Estados vazios com ilustracoes

### Feedback
- Loading: Skeleton ou Loader2 spinner
- Erro: Mensagem com icone
- Sucesso: Invalidacao automatica do cache (refetch)

## Temas

O sistema suporta light e dark mode:
- Classes Tailwind com prefixo `dark:`
- Cores semanticas (gray, blue, green, red, amber)
- Transicoes suaves entre temas

## Internacionalizacao

O projeto esta em portugues brasileiro (pt-BR).
Textos hardcoded nos componentes (sem i18n library no momento).
