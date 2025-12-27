# Sistema de Usuarios

## Visao Geral

Gerenciamento de usuarios do sistema com autenticacao, dados pessoais e vinculo a times.

## Arquivos

```
resources/js/
├── api/users.ts              # API e tipos
├── hooks/useUsers.ts         # React Query hooks
├── components/users/
│   └── UserFormDrawer.tsx    # Formulario de criacao/edicao
└── pages/users/
    └── UsersIndex.tsx        # Pagina principal
```

## Modelo de Dados

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  cpf?: string;           // CPF com mascara 000.000.000-00
  phone?: string;         // Telefone com mascara
  avatar?: string;
  is_active?: boolean;
  team_id?: number;
  team?: {
    id: number;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}
```

## Funcionalidades

### Listagem
- Tabela com colunas: Nome/Email, CPF, Telefone, Time, Status, Acoes
- Busca por nome, email ou CPF
- Filtro por time
- Filtro por status (ativo/inativo)

### Criacao/Edicao
- Drawer lateral com formulario
- Campos: Nome, Email, CPF, Telefone, Senha, Time
- Validacao de campos obrigatorios
- Mascara automatica para CPF e telefone

### Exclusao
- Confirmacao via AlertDialog
- Soft delete (desativa usuario)

## Endpoints API

```
GET    /api/users              # Lista usuarios
POST   /api/users              # Cria usuario
GET    /api/users/:id          # Busca usuario
PUT    /api/users/:id          # Atualiza usuario
DELETE /api/users/:id          # Remove usuario
```

## Hooks Disponiveis

```typescript
useUsers(params?)           // Lista usuarios com filtros
useUser(id)                 // Busca usuario por ID
useCreateUser()             // Cria usuario
useUpdateUser()             // Atualiza usuario
useDeleteUser()             // Remove usuario
useToggleUserStatus()       // Alterna status ativo/inativo
```

## Formatacao

```typescript
// CPF
formatCPF('12345678900') // '123.456.789-00'

// Telefone
formatPhone('11999999999') // '(11) 99999-9999'
```
