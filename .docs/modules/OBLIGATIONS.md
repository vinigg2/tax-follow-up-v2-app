# Sistema de Modelos de Obrigacoes

## Visao Geral

Modelos de Obrigacoes sao templates/cadastros que definem obrigacoes fiscais recorrentes. Eles servem como base para geracao automatica de tarefas.

> **Nota:** No sistema, "Modelos de Obrigacoes" sao cadastros base. As "Tarefas" sao as instancias de trabalho geradas a partir desses modelos.

## Conceito

```
Modelo de Obrigacao (Template)
    │
    ├── Frequencia (MM/QT/AA)
    ├── Prazo (dia do mes)
    ├── Tipo (kind)
    │
    └── Usado por ──> Tarefas (instancias)
                          │
                          ├── Empresa vinculada (na tarefa)
                          ├── Competencia calculada
                          ├── Data de vencimento
                          └── Checklist
```

> **Nota:** Empresas sao vinculadas diretamente as Tarefas, nao aos Modelos de Obrigacoes. Isso permite maior flexibilidade, onde um mesmo modelo pode ser usado por diferentes empresas.

## Arquivos

```
resources/js/
├── api/obligations.ts                  # API e tipos
├── hooks/useObligations.ts             # React Query hooks
├── components/obligations/
│   ├── ObligationFormModal.tsx         # Modal de criacao/edicao
│   └── ObligationPreview.tsx           # Preview de competencia/prazo
└── pages/obligations/
    └── ObligationsIndex.tsx            # Pagina principal
```

## Modelo de Dados

```typescript
type ObligationKind =
  | 'obrigacoes_acessorias'
  | 'impostos_diretos'
  | 'impostos_indiretos'
  | 'outros';

type ObligationFrequency = 'MM' | 'QT' | 'AA';

interface Obligation {
  id: number;
  title: string;
  kind: ObligationKind;
  description?: string;
  frequency: ObligationFrequency;    // Mensal, Trimestral, Anual
  day_deadline: number;               // Dia do vencimento (1-31)
  month_deadline?: number;            // Mes (para anuais)
  period: number;                     // Offset de periodo (0, 1, 2)
  companies_count?: number;
  generate_automatic_tasks: boolean;
  months_advanced?: number;           // Meses de antecedencia
  initial_generation_date?: string;
  final_generation_date?: string;
  created_at?: string;
  updated_at?: string;
}
```

## Tipos de Obrigacao (Kind)

| Valor | Label |
|-------|-------|
| `obrigacoes_acessorias` | Obrigacoes Acessorias |
| `impostos_diretos` | Impostos Diretos |
| `impostos_indiretos` | Impostos Indiretos |
| `outros` | Outros |

## Frequencias

| Valor | Label | Exemplo |
|-------|-------|---------|
| `MM` | Mensal | Todo mes |
| `QT` | Trimestral | 1T, 2T, 3T, 4T |
| `AA` | Anual | Uma vez por ano |

## Calculo de Competencia e Prazo

### Periodo
O campo `period` define o offset em relacao ao periodo atual:
- `0`: Periodo atual
- `1`: Proximo periodo
- `2`: Dois periodos a frente

### Exemplos

**Mensal (MM):**
- Periodo 0 = Mes atual
- Periodo 1 = Proximo mes

**Trimestral (QT):**
- Periodo 0 = Trimestre atual
- Periodo 1 = Proximo trimestre

**Anual (AA):**
- Periodo 0 = Ano atual
- Periodo 1 = Proximo ano

### Preview

O componente `ObligationPreview` mostra:
```
Competencia 2025/1T e prazo para entrega 04/03/2025
```

## Funcionalidades

### Listagem
- Tabela com obrigacoes
- Filtro por tipo (kind)
- Filtro por frequencia
- Busca por titulo
- Indicador de geracao automatica

### Criacao/Edicao (Modal)
Secoes:
1. **Dados Basicos**: Titulo, Tipo, Descricao
2. **Configuracao de Prazo**: Frequencia, Dia, Periodo
3. **Preview**: Mostra competencia e prazo calculados
4. **Geracao Automatica**: Toggle e configuracoes

### Geracao de Tarefas
- Botao "Gerar Tarefas" no dropdown de acoes
- Permite selecionar empresas no momento da geracao
- Confirmacao antes de gerar

## Endpoints API

```
GET    /api/obligations                    # Lista obrigacoes
POST   /api/obligations                    # Cria obrigacao
GET    /api/obligations/:id                # Busca obrigacao
PUT    /api/obligations/:id                # Atualiza obrigacao
DELETE /api/obligations/:id                # Remove obrigacao
POST   /api/obligations/:id/preview        # Preview de datas
POST   /api/obligations/:id/generate-tasks # Gera tarefas
GET    /api/obligations/:id/companies      # Lista empresas vinculadas
POST   /api/obligations/:id/companies      # Vincula empresas
```

## Hooks Disponiveis

```typescript
useObligations(params?)              // Lista obrigacoes
useObligation(id)                    // Busca obrigacao
useCreateObligation()                // Cria obrigacao
useUpdateObligation()                // Atualiza obrigacao
useDeleteObligation()                // Remove obrigacao
useObligationPreview()               // Preview de datas
useGenerateTasks()                   // Gera tarefas
useObligationCompanies(id)           // Lista empresas
useAssignObligationCompanies()       // Vincula empresas
```
