# Sistema de Times

## Visao Geral

Gerenciamento de times/departamentos para organizacao de usuarios.

## Arquivos

```
resources/js/
├── api/teams.ts              # API e tipos
├── hooks/useTeams.ts         # React Query hooks
├── components/teams/
│   └── TeamFormDrawer.tsx    # Formulario de criacao/edicao
└── pages/teams/
    └── TeamsIndex.tsx        # Pagina principal
```

## Modelo de Dados

```typescript
interface Team {
  id: number;
  name: string;
  description?: string;
  color?: string;           // Cor para identificacao visual
  users_count?: number;     // Quantidade de usuarios
  created_at?: string;
  updated_at?: string;
}
```

## Funcionalidades

### Listagem
- Cards ou tabela com times
- Contador de usuarios por time
- Cor de identificacao
- Busca por nome

### Criacao/Edicao
- Drawer lateral com formulario
- Campos: Nome, Descricao, Cor
- Seletor de cor visual

### Exclusao
- Confirmacao via AlertDialog
- Verifica se existem usuarios vinculados

## Endpoints API

```
GET    /api/teams              # Lista times
POST   /api/teams              # Cria time
GET    /api/teams/:id          # Busca time
PUT    /api/teams/:id          # Atualiza time
DELETE /api/teams/:id          # Remove time
```

## Hooks Disponiveis

```typescript
useTeams()                  // Lista todos os times
useTeam(id)                 // Busca time por ID
useCreateTeam()             // Cria time
useUpdateTeam()             // Atualiza time
useDeleteTeam()             // Remove time
```

## Uso em Outros Modulos

O time e usado como referencia em:
- Usuarios (team_id)
- Filtros de tarefas
- Relatorios
