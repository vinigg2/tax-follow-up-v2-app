# Sistema de Empresas

## Visao Geral

Gerenciamento de empresas/clientes do escritorio contabil.

## Arquivos

```
resources/js/
├── api/companies.ts          # API e tipos
├── hooks/useCompanies.ts     # React Query hooks
├── components/companies/
│   └── CompanyFormDrawer.tsx # Formulario de criacao/edicao
└── pages/companies/
    └── CompaniesIndex.tsx    # Pagina principal
```

## Modelo de Dados

```typescript
interface Company {
  id: number;
  name: string;
  trade_name?: string;        // Nome fantasia
  cnpj: string;               // CNPJ com mascara
  ie?: string;                // Inscricao estadual
  im?: string;                // Inscricao municipal
  email?: string;
  phone?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  };
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
```

## Funcionalidades

### Listagem
- Tabela com empresas
- Busca por nome, nome fantasia ou CNPJ
- Filtro por status (ativo/inativo)

### Criacao/Edicao
- Drawer lateral com formulario
- Abas: Dados Principais, Endereco
- Mascara automatica para CNPJ
- Busca de endereco por CEP

### Exclusao
- Confirmacao via AlertDialog
- Verifica vinculos com obrigacoes/tarefas

## Endpoints API

```
GET    /api/companies          # Lista empresas
POST   /api/companies          # Cria empresa
GET    /api/companies/:id      # Busca empresa
PUT    /api/companies/:id      # Atualiza empresa
DELETE /api/companies/:id      # Remove empresa
```

## Hooks Disponiveis

```typescript
useCompanies(params?)       // Lista empresas com filtros
useCompany(id)              // Busca empresa por ID
useCreateCompany()          // Cria empresa
useUpdateCompany()          // Atualiza empresa
useDeleteCompany()          // Remove empresa
```

## Uso em Outros Modulos

A empresa e vinculada a:
- Obrigacoes (uma obrigacao pode ter varias empresas)
- Tarefas (cada tarefa pertence a uma empresa)
