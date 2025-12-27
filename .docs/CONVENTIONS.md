# Convencoes de Codigo

## Nomenclatura

### Arquivos
- **Componentes**: PascalCase (`UserFormDrawer.tsx`)
- **Hooks**: camelCase com prefixo "use" (`useUsers.ts`)
- **API**: camelCase (`users.ts`)
- **Paginas**: PascalCase (`UsersIndex.tsx`)

### Variaveis e Funcoes
- **Variaveis**: camelCase (`userName`)
- **Constantes**: UPPER_SNAKE_CASE (`TASK_STATUSES`)
- **Funcoes**: camelCase (`handleSubmit`)
- **Tipos/Interfaces**: PascalCase (`UserFormData`)

### CSS Classes
- Usar Tailwind CSS
- Classes personalizadas em kebab-case
- Prefixo `dark:` para dark mode

## Estrutura de Arquivos

### API Layer
```typescript
// api/[module].ts

// 1. Imports
import api from './axios';

// 2. Types
export type ModuleStatus = 'active' | 'inactive';

export interface Module {
  id: number;
  // ...
}

export interface ModulesResponse {
  modules: Module[];
  total?: number;
}

// 3. Constants
export const MODULE_STATUSES: Record<ModuleStatus, { label: string; color: string }> = {
  // ...
};

// 4. API Object
export const moduleApi = {
  getAll: async (): Promise<ModulesResponse> => {
    const response = await api.get('/modules');
    return response.data;
  },
  // ...
};
```

### Hooks Layer
```typescript
// hooks/use[Module].ts

// 1. Imports
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleApi, Module, ModulesResponse } from '@/api/module';

// 2. Query Hooks
export function useModules() {
  return useQuery<ModulesResponse>({
    queryKey: ['modules'],
    queryFn: () => moduleApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

// 3. Mutation Hooks
export function useCreateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ModuleFormData) => moduleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });
}
```

### Componentes
```typescript
// components/[module]/[Component].tsx

// 1. Imports (ordem: react, libs externas, internos, tipos)
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useCreateModule } from '@/hooks/useModule';

// 2. Tipos locais
interface ComponentProps {
  // ...
}

// 3. Constantes locais
const INITIAL_STATE = {};

// 4. Componente
export function Component({ prop }: ComponentProps) {
  // 4.1 Hooks
  const [state, setState] = useState();
  const mutation = useCreateModule();

  // 4.2 Handlers
  const handleSubmit = () => {};

  // 4.3 Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

## Padroes React Query

### Query Keys
```typescript
// Simples
['modules']

// Com parametros
['modules', { status: 'active' }]

// Aninhado
['module', moduleId]
['module', moduleId, 'items']
```

### Invalidacao
```typescript
// Invalida lista
queryClient.invalidateQueries({ queryKey: ['modules'] });

// Invalida item especifico
queryClient.invalidateQueries({ queryKey: ['module', id] });

// Invalida tudo relacionado
queryClient.invalidateQueries({ queryKey: ['module'] });
```

## Componentes UI

### Modais vs Drawers
- **Modal (Dialog)**: Formularios complexos, previews, confirmacoes
- **Drawer (Sheet)**: Formularios simples, detalhes, edicao rapida

### Confirmacao de Exclusao
Sempre usar `AlertDialog`:
```tsx
<AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Titulo</AlertDialogTitle>
      <AlertDialogDescription>Mensagem</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className="bg-red-600">
        Excluir
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Loading States
```tsx
// Spinner inline
{isPending && <Loader2 className="w-4 h-4 animate-spin" />}

// Skeleton para listas
<Skeleton className="h-16 w-full" />

// Centralizado
<div className="flex items-center justify-center py-8">
  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
</div>
```

### Empty States
```tsx
<EmptyState
  illustration="/images/illustrations/21.svg"
  illustrationDark="/images/illustrations/21-dark.svg"
  title="Nenhum item encontrado"
  description="Descricao do estado vazio"
  action={{
    label: 'Criar Novo',
    onClick: handleCreate,
    icon: Plus,
  }}
/>
```

## Git

### Commits
- Usar mensagens em portugues
- Formato: `tipo: descricao`
- Tipos: `feat`, `fix`, `refactor`, `style`, `docs`, `test`

### Branches
- `main` - producao
- `develop` - desenvolvimento
- `feature/nome` - novas funcionalidades
- `fix/nome` - correcoes
