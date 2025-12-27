# Tax Follow Up - Documentacao do Projeto

Sistema de gerenciamento de obrigacoes fiscais e tarefas para escritorios de contabilidade.

## Stack Tecnologica

### Backend
- **Laravel** - Framework PHP
- **MySQL** - Banco de dados

### Frontend
- **React 18** com TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Estilizacao
- **Shadcn/ui** - Componentes UI (baseado em Radix UI)
- **React Query (TanStack Query)** - Gerenciamento de estado e cache
- **Metronic Theme** - Template base para o layout

## Estrutura do Projeto

```
resources/js/
├── api/                    # Camada de API (axios requests)
├── components/             # Componentes reutilizaveis
│   ├── ui/                 # Componentes Shadcn/ui
│   ├── layout/             # Layout components (Sidebar, Header)
│   ├── tasks/              # Componentes de tarefas
│   ├── users/              # Componentes de usuarios
│   ├── companies/          # Componentes de empresas
│   ├── teams/              # Componentes de times
│   └── obligations/        # Componentes de obrigacoes
├── hooks/                  # Custom hooks (React Query)
├── pages/                  # Paginas da aplicacao
├── lib/                    # Utilitarios e helpers
├── config/                 # Configuracoes (menu, etc)
└── types/                  # Tipos TypeScript globais
```

## Documentacao por Modulo

- [Arquitetura Frontend](./ARCHITECTURE.md)
- [Sistema de Usuarios](./modules/USERS.md)
- [Sistema de Times](./modules/TEAMS.md)
- [Sistema de Empresas](./modules/COMPANIES.md)
- [Sistema de Obrigacoes](./modules/OBLIGATIONS.md)
- [Sistema de Tarefas](./modules/TASKS.md)
- [Sistema de Checklist](./modules/CHECKLISTS.md)

## Padroes de Codigo

### API Layer
Cada modulo possui um arquivo em `api/` que define:
- Interfaces/tipos TypeScript
- Constantes (status, tipos, etc)
- Funcoes de chamada API usando axios

### Hooks
Cada modulo possui um arquivo em `hooks/` com:
- Hooks de query (useQuery) para leitura
- Hooks de mutation (useMutation) para escrita
- Invalidacao automatica de cache

### Componentes
- Formularios em Drawers ou Modais
- Tabelas com filtros e busca
- Estados vazios com ilustracoes
- Confirmacao de exclusao via AlertDialog

## Comandos Uteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit
```
