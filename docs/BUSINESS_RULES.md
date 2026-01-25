# Regras de Negocio - Tax Follow Up

Este documento descreve as regras de negocio do sistema Tax Follow Up.

## Indice

1. [Conceitos Principais](#conceitos-principais)
2. [Sistema de Permissoes](#sistema-de-permissoes)
3. [Grupos (Teams)](#grupos-teams)
4. [Empresas (Companies)](#empresas-companies)
5. [Obrigacoes (Obligations)](#obrigacoes-obligations)
6. [Tarefas (Tasks)](#tarefas-tasks)
7. [Documentos (Documents)](#documentos-documents)
8. [Fluxo de Aprovacao](#fluxo-de-aprovacao)
9. [Notificacoes](#notificacoes)
10. [Autenticacao e MFA](#autenticacao-e-mfa)

---

## Conceitos Principais

### Hierarquia do Sistema

```
Grupo (Team)
├── Usuarios (com diferentes funcoes)
├── Empresas
│   └── Tarefas
│       ├── Documentos
│       └── Checklists
└── Obrigacoes (Templates)
    └── Geram Tarefas automaticamente
```

### Tenant (Multi-tenancy)

- Cada **Grupo** funciona como um tenant isolado
- Usuarios podem pertencer a multiplos grupos
- Dados sao filtrados pelo grupo selecionado no frontend
- Header `X-Tenant-Group-Ids` indica os grupos ativos

---

## Sistema de Permissoes

### Funcoes (Roles)

O sistema possui tres funcoes hierarquicas:

| Funcao | Nivel | Descricao |
|--------|-------|-----------|
| **Admin** | 3 | Acesso total ao grupo |
| **Manager** | 2 | Gerencia conteudo, nao gerencia usuarios/empresas |
| **Member** | 1 | Apenas visualiza e faz upload de documentos |

### Matriz de Permissoes

| Acao | Admin | Manager | Member |
|------|:-----:|:-------:|:------:|
| **Tarefas** |
| Visualizar tarefas | ✅ | ✅ | ✅ |
| Criar/editar tarefas | ✅ | ✅ | ❌ |
| Arquivar tarefas | ✅ | ✅ | ❌ |
| Atribuir responsavel | ✅ | ✅ | ❌ |
| **Documentos** |
| Visualizar documentos | ✅ | ✅ | ✅ |
| Upload de documentos | ✅ | ✅ | ✅ |
| Aprovar/rejeitar | ✅ | ✅ | ❌ |
| **Obrigacoes** |
| Visualizar obrigacoes | ✅ | ✅ | ✅ |
| Criar/editar obrigacoes | ✅ | ✅ | ❌ |
| Gerar tarefas | ✅ | ✅ | ❌ |
| **Empresas** |
| Visualizar empresas | ✅ | ✅ | ✅ |
| Criar/editar empresas | ✅ | ❌ | ❌ |
| **Usuarios** |
| Visualizar usuarios | ✅ | ✅ | ✅ |
| Convidar usuarios | ✅ | ✅ | ❌ |
| Criar/editar usuarios | ✅ | ❌ | ❌ |
| Alterar funcoes | ✅ | ❌ | ❌ |

### Owner (Proprietario)

- O **Owner** e o criador do grupo
- Possui todas as permissoes de Admin
- E o unico que pode excluir o grupo
- Nao pode ser removido do grupo

---

## Grupos (Teams)

### Regras

1. Todo usuario deve pertencer a pelo menos um grupo para acessar o sistema
2. O criador do grupo se torna automaticamente Owner e Admin
3. Usuarios podem ser convidados por email
4. Um grupo pode ser marcado como "deleted" (soft delete)

### Convites

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Admin     │────►│  Convite    │────►│  Usuario    │
│  convida    │     │  por email  │     │  aceita     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Adicionado  │
                    │  ao grupo   │
                    │ como Member │
                    └─────────────┘
```

- Convites expiram apos periodo configurado
- Usuario pode aceitar convite apenas com o email correto
- Convite define se usuario sera Admin ou Member

---

## Empresas (Companies)

### Regras

1. Empresas pertencem a um grupo
2. CNPJ deve ser unico dentro do grupo
3. Empresas sao vinculadas a tarefas
4. Apenas Admins podem criar/editar empresas

### Campos

| Campo | Obrigatorio | Descricao |
|-------|:-----------:|-----------|
| name | Sim | Nome da empresa |
| cnpj | Nao | CNPJ (formatado) |
| country | Sim | Pais (default: BR) |
| address | Nao | Endereco completo |
| city | Nao | Cidade |
| state | Nao | Estado |
| zip_code | Nao | CEP |

---

## Obrigacoes (Obligations)

Obrigacoes sao **templates** que geram tarefas automaticamente.

### Frequencias

| Codigo | Descricao | Geracao |
|--------|-----------|---------|
| MM | Mensal | Todo mes |
| QT | Trimestral | A cada 3 meses |
| AA | Anual | Uma vez por ano |

### Campos de Prazo

- **day_deadline**: Dia do mes para vencimento (1-31)
- **month_deadline**: Mes do vencimento (apenas para AA)
- **period**: Meses apos a competencia (ex: 1 = mes seguinte)

### Exemplo: DCTF Mensal

```
Frequencia: MM (Mensal)
day_deadline: 15
period: 1

Competencia Dezembro/2024:
- Tarefa gerada: Janeiro/2025
- Vencimento: 15/01/2025
```

### Geracao de Tarefas

```
┌──────────────┐
│  OBRIGACAO   │
│  (Template)  │
└──────┬───────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌──────────────┐                  ┌──────────────┐
│   MANUAL     │                  │  AUTOMATICO  │
│  (Botao UI)  │                  │   (CRON)     │
└──────┬───────┘                  └──────┬───────┘
       │                                  │
       ▼                                  ▼
┌────────────────────────────────────────────────┐
│              PARA CADA EMPRESA                  │
│         vinculada a obrigacao                   │
└──────────────────────┬─────────────────────────┘
                       │
                       ▼
               ┌──────────────┐
               │    TAREFA    │
               │   CRIADA     │
               └──────────────┘
```

### Tipos de Documento por Obrigacao

Cada obrigacao pode ter multiplos tipos de documento:

| Campo | Descricao |
|-------|-----------|
| name | Nome do documento |
| is_obligatory | Obrigatorio para finalizar tarefa |
| estimated_days | Prazo estimado para upload |
| approval_required | N=Nenhuma, S=Sequencial, P=Paralelo |

---

## Tarefas (Tasks)

### Estados (Status)

```
┌────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│  NEW   │────►│ PENDING │────►│   LATE   │────►│ FINISHED │
└────────┘     └─────────┘     └──────────┘     └──────────┘
                                    │
                                    ▼
                              ┌──────────┐
                              │ ARCHIVED │
                              └──────────┘
```

| Status | Descricao |
|--------|-----------|
| new | Recém criada, sem atividade |
| pending | Em andamento |
| late | Prazo vencido |
| finished | Todos documentos concluidos |
| archived | Arquivada (inativa) |

### Transicoes de Status

1. **new → pending**: Quando inicia trabalho (upload, checklist, etc)
2. **pending → late**: Automatico quando passa do deadline
3. **pending/late → finished**: Quando todos documentos obrigatorios estao "finished"
4. **any → archived**: Manual, marca tarefa como inativa

### Campos

| Campo | Descricao |
|-------|-----------|
| title | Titulo da tarefa |
| description | Descricao opcional |
| deadline | Data de vencimento |
| status | Estado atual |
| company_id | Empresa vinculada |
| responsible | Usuario responsavel |
| competency | Periodo de referencia (YYYY-MM-01) |
| percent | Percentual de conclusao (calculado) |

### Calculo do Percentual

```
percent = (documentos_finalizados / total_documentos_obrigatorios) * 100
```

---

## Documentos (Documents)

### Estados

```
┌───────────┐     ┌─────────┐     ┌─────────────┐     ┌──────────┐
│ UNSTARTED │────►│ STARTED │────►│ ON_APPROVAL │────►│ FINISHED │
└───────────┘     └─────────┘     └─────────────┘     └──────────┘
                                         │
                                         ▼
                                  ┌───────────┐
                                  │ RESTARTED │
                                  └───────────┘
                                         │
                                         └────────────► STARTED
```

| Status | Descricao |
|--------|-----------|
| unstarted | Aguardando upload |
| started | Upload iniciado/em andamento |
| on_approval | Aguardando aprovacao |
| finished | Aprovado/finalizado |
| restarted | Rejeitado, precisa novo upload |

### Tipos de Aprovacao

| Tipo | Descricao | Fluxo |
|------|-----------|-------|
| N | Sem aprovacao | Upload → Finished |
| S | Sequencial | Upload → Aprovador 1 → Aprovador 2 → ... → Finished |
| P | Paralelo | Upload → Todos aprovadores simultaneamente → Finished |

---

## Fluxo de Aprovacao

### Aprovacao Sequencial (S)

```
┌────────┐     ┌────────────┐     ┌────────────┐     ┌──────────┐
│ UPLOAD │────►│ APROVADOR  │────►│ APROVADOR  │────►│ FINISHED │
│        │     │     1      │     │     2      │     │          │
└────────┘     └─────┬──────┘     └─────┬──────┘     └──────────┘
                     │                   │
                     ▼                   ▼
               ┌──────────┐        ┌──────────┐
               │ REJEITOU │        │ REJEITOU │
               └────┬─────┘        └────┬─────┘
                    │                   │
                    ▼                   ▼
               ┌──────────────────────────────┐
               │  RESTARTED (novo upload)     │
               └──────────────────────────────┘
```

- Aprovadores sao acionados na ordem (sequence)
- Se um rejeita, documento volta para RESTARTED
- Proximo aprovador so e acionado apos aprovacao anterior

### Aprovacao Paralela (P)

```
┌────────┐     ┌────────────────────────┐     ┌──────────┐
│ UPLOAD │────►│ TODOS APROVADORES      │────►│ FINISHED │
│        │     │ (simultaneamente)      │     │          │
└────────┘     └───────────┬────────────┘     └──────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ QUALQUER UM  │
                    │   REJEITOU   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  RESTARTED   │
                    └──────────────┘
```

- Todos aprovadores podem aprovar/rejeitar simultaneamente
- Documento so finaliza quando TODOS aprovam
- Se qualquer um rejeita, documento volta para RESTARTED

### Assinaturas (ApproverSignature)

| Campo | Descricao |
|-------|-----------|
| document_id | Documento sendo aprovado |
| user_id | Usuario aprovador |
| sequence | Ordem (para aprovacao sequencial) |
| status | pending, signed, rejected |
| comment | Comentario opcional |
| signed_at | Data/hora da assinatura |

---

## Notificacoes

### Tipos de Notificacao

| Evento | Descricao |
|--------|-----------|
| task_assigned | Tarefa atribuida ao usuario |
| task_deadline_near | Prazo proximo (3 dias) |
| task_overdue | Tarefa atrasada |
| document_pending_approval | Documento aguardando sua aprovacao |
| document_approved | Seu documento foi aprovado |
| document_rejected | Seu documento foi rejeitado |

### Preferencias do Usuario

| Preferencia | Descricao |
|-------------|-----------|
| daily_notifications | Resumo diario por email |
| weekly_notifications | Resumo semanal por email |
| monthly_notifications | Resumo mensal por email |

---

## Autenticacao e MFA

### Fluxo de Login

1. Usuario informa email/senha
2. Sistema valida credenciais
3. Se MFA ativado:
   - TOTP: Usuario insere codigo do app
   - Email: Sistema envia codigo por email
4. Apos validacao, gera token JWT

### MFA (Multi-Factor Authentication)

| Metodo | Descricao |
|--------|-----------|
| TOTP | Google Authenticator, Authy, etc |
| Email | Codigo de 6 digitos enviado por email |

### Backup Codes

- 8 codigos de uso unico
- Gerados ao ativar MFA
- Podem ser regenerados (invalida anteriores)
- Uso de backup code remove ele da lista

---

## Regras de Negocio Adicionais

### Tarefas

1. Tarefa so pode ser editada se nao estiver arquivada
2. Responsavel deve pertencer ao mesmo grupo
3. Deadline nao pode ser no passado (para novas tarefas)
4. Tarefa e finalizada automaticamente quando todos docs obrigatorios estao "finished"

### Documentos

1. Arquivo obrigatorio se `required_file = true`
2. Extensoes permitidas: pdf, doc, docx, xls, xlsx, ppt, pptx, jpg, jpeg, png, gif, zip, rar, 7z, txt, csv
3. Tamanho maximo: 50MB
4. Comentario obrigatorio ao rejeitar

### Obrigacoes

1. Geracao automatica roda diariamente via CRON
2. Preview mostra tarefas que serao geradas sem criar
3. Obrigacao pode ser desativada (nao gera mais tarefas)

### Grupos

1. Grupo deletado nao aparece mais para usuarios
2. Owner nao pode sair do grupo
3. Admin pode promover/rebaixar outros usuarios (exceto Owner)

---

## Glossario

| Termo | Descricao |
|-------|-----------|
| **Competencia** | Periodo de referencia (mes/ano) da obrigacao |
| **Obrigacao** | Template que define um tipo de entrega fiscal |
| **Tarefa** | Instancia de uma obrigacao para uma empresa/periodo |
| **Documento** | Arquivo necessario para completar uma tarefa |
| **Aprovador** | Usuario designado para aprovar documentos |
| **Grupo/Team** | Organizacao que agrupa usuarios e empresas |
| **Tenant** | Contexto de isolamento de dados por grupo |
