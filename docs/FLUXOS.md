# Fluxogramas do Sistema Tax Follow Up

## 1. Fluxo de Autenticacao

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUXO DE LOGIN                                     │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  LOGIN   │
    │ (email/  │
    │  senha)  │
    └────┬─────┘
         │
         ▼
    ┌──────────┐     Nao
    │ Usuario  ├──────────────► Erro: Credenciais invalidas
    │ valido?  │
    └────┬─────┘
         │ Sim
         ▼
    ┌──────────┐     Nao
    │ is_active├──────────────► Erro: Usuario desativado
    │    ?     │
    └────┬─────┘
         │ Sim
         ▼
    ┌──────────┐     Nao      ┌──────────┐
    │   MFA    ├─────────────►│  Gerar   │
    │ ativado? │              │  Token   │
    └────┬─────┘              └────┬─────┘
         │ Sim                     │
         ▼                         ▼
    ┌──────────┐              ┌──────────┐
    │  Metodo  │              │  LOGIN   │
    │   MFA?   │              │ COMPLETO │
    └────┬─────┘              └──────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌──────┐
│ TOTP │  │EMAIL │
│      │  │ OTP  │
└──┬───┘  └──┬───┘
   │         │
   │         ▼
   │    ┌──────────┐
   │    │  Enviar  │
   │    │  codigo  │
   │    │  email   │
   │    └────┬─────┘
   │         │
   ▼         ▼
┌─────────────────┐
│ Inserir codigo  │
│ (6 digitos)     │
└───────┬─────────┘
        │
        ▼
   ┌──────────┐     Nao
   │ Codigo   ├──────────────► Erro: Codigo invalido
   │ valido?  │
   └────┬─────┘
        │ Sim
        ▼
   ┌──────────┐
   │  Gerar   │
   │  Token   │
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │  LOGIN   │
   │ COMPLETO │
   └──────────┘
```

## 2. Fluxo de Tarefas (Tasks)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CICLO DE VIDA DA TAREFA                               │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │  OBRIGACAO  │
                              │ (Template)  │
                              └──────┬──────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │  Manual  │    │Automatico│    │  Preview │
              │ generate │    │  (Cron)  │    │  tasks   │
              └────┬─────┘    └────┬─────┘    └──────────┘
                   │               │
                   └───────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    TAREFA    │
                    │   CRIADA     │
                    │ status: new  │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  Upload  │    │ Deadline │    │ Arquivar │
    │Documentos│    │ proximo  │    │          │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         │               ▼               ▼
         │         ┌──────────┐   ┌──────────┐
         │         │ PENDING  │   │ ARCHIVED │
         │         │ (7 dias) │   │is_active │
         │         └────┬─────┘   │ = false  │
         │              │         └──────────┘
         │              │
         │    ┌─────────┼─────────┐
         │    │         │         │
         │    ▼         ▼         ▼
         │  Docs OK   Atrasou   Retificar
         │    │         │         │
         ▼    ▼         ▼         ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ FINISHED │  │   LATE   │  │RECTIFIED │
    │          │  │          │  │          │
    └──────────┘  └────┬─────┘  └────┬─────┘
                       │             │
                       │             ▼
                       │      ┌──────────────┐
                       │      │ Nova Tarefa  │
                       │      │ (correcao)   │
                       │      └──────────────┘
                       │
                       ▼
                 ┌──────────┐
                 │ delayed_ │
                 │  days++  │
                 └──────────┘
```

## 3. Fluxo de Documentos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE DOCUMENTOS                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │ TAREFA   │
    │          │
    └────┬─────┘
         │
         ▼
    ┌──────────────┐
    │  Documentos  │ (criados automaticamente
    │  da Tarefa   │  baseado no DocumentType
    └──────┬───────┘  da Obrigacao)
           │
           ▼
    ┌──────────────┐
    │  UNSTARTED   │
    │              │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   Upload     │
    │   Arquivo    │
    └──────┬───────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
  ┌──────┐  ┌──────────┐
  │Direct│  │Presigned │
  │Upload│  │URL (S3)  │
  └──┬───┘  └────┬─────┘
     │           │
     │           ▼
     │    ┌──────────────┐
     │    │registerUpload│
     │    └──────┬───────┘
     │           │
     └─────┬─────┘
           │
           ▼
    ┌──────────────┐     Nao      ┌──────────────┐
    │  Aprovacao   ├─────────────►│   FINISHED   │
    │  necessaria? │              │              │
    └──────┬───────┘              └──────────────┘
           │ Sim
           ▼
    ┌──────────────┐
    │  ON_APPROVAL │
    │              │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   Tipo de    │
    │  Aprovacao?  │
    └──────┬───────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
  ┌──────┐  ┌──────────┐
  │Sequen│  │ Paralela │
  │ cial │  │          │
  └──┬───┘  └────┬─────┘
     │           │
     ▼           ▼
  Aprovador   Todos os
  1, depois   aprovadores
  2, depois   ao mesmo
  3...        tempo
     │           │
     └─────┬─────┘
           │
           ▼
    ┌──────────────┐
    │  Aprovador   │
    │   decide     │
    └──────┬───────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
  ┌──────┐  ┌──────────┐
  │Aprova│  │ Rejeita  │
  └──┬───┘  └────┬─────┘
     │           │
     ▼           ▼
  ┌──────┐  ┌──────────┐
  │Todos │  │ RESTARTED│
  │aprov?│  │ (refazer)│
  └──┬───┘  └──────────┘
     │
     │ Sim
     ▼
  ┌──────────────┐
  │   FINISHED   │
  │              │
  └──────────────┘
```

## 4. Fluxo de Obrigacoes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FLUXO DE OBRIGACOES                                      │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   CRIAR      │
    │  OBRIGACAO   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────────────────────┐
    │           CONFIGURAR                  │
    │  - Titulo, Descricao                 │
    │  - Frequencia (MM/QT/AA)             │
    │  - Dia/Mes do vencimento             │
    │  - Grupo (Time)                      │
    │  - Tipo (kind)                       │
    │  - Periodo de geracao                │
    │  - Campos dinamicos                  │
    │  - Fluxograma                        │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │      CONFIGURAR DOCUMENT TYPES        │
    │  - Tipos de documento necessarios    │
    │  - Obrigatorios ou opcionais         │
    │  - Dias estimados                    │
    │  - Aprovadores                       │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │    VINCULAR EMPRESAS + USUARIOS       │
    │  ObligationCompanyUser               │
    │  - Empresa                           │
    │  - Usuario responsavel               │
    └──────────────┬───────────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
    ┌──────────┐     ┌──────────────┐
    │  Manual  │     │  Automatico  │
    │ generate │     │    (Cron)    │
    └────┬─────┘     └──────┬───────┘
         │                  │
         │            ┌─────┴─────┐
         │            │ Diario    │
         │            │ 06:00 AM  │
         │            └─────┬─────┘
         │                  │
         │     generate_automatic_tasks = true?
         │                  │
         │                  ▼
         │     ┌────────────────────────┐
         │     │ Para cada empresa      │
         │     │ vinculada, verificar:  │
         │     │ - Competencia          │
         │     │ - Tarefa ja existe?    │
         │     └───────────┬────────────┘
         │                 │
         └────────┬────────┘
                  │
                  ▼
    ┌──────────────────────────────────────┐
    │         CRIAR TAREFAS                 │
    │  - Uma tarefa por empresa/competencia│
    │  - Deadline calculado pela frequencia│
    │  - Documentos clonados do template   │
    │  - Responsavel atribuido             │
    └──────────────────────────────────────┘
```

## 5. Fluxo de Notificacoes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FLUXO DE NOTIFICACOES                                    │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │   SCHEDULER     │
                    │  (Kernel.php)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   ┌─────────┐         ┌─────────┐         ┌─────────┐
   │ Diario  │         │ Semanal │         │ Mensal  │
   │ 08:00   │         │ Seg 8:00│         │ Dia 1   │
   └────┬────┘         └────┬────┘         └────┬────┘
        │                   │                   │
        ▼                   ▼                   ▼
   ┌─────────────────────────────────────────────────┐
   │              PARA CADA USUARIO                   │
   │         (daily/weekly/monthly_notifications)     │
   └─────────────────────────┬───────────────────────┘
                             │
                             ▼
   ┌─────────────────────────────────────────────────┐
   │               COLETAR DADOS                      │
   │  - Tarefas atrasadas                            │
   │  - Tarefas vencem hoje                          │
   │  - Tarefas proximos 7 dias                      │
   │  - Estatisticas                                 │
   └─────────────────────────┬───────────────────────┘
                             │
                             ▼
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
       ┌──────────┐                  ┌──────────┐
       │  EMAIL   │                  │ DATABASE │
       │          │                  │          │
       └────┬─────┘                  └────┬─────┘
            │                             │
            ▼                             ▼
       ┌──────────┐                  ┌──────────┐
       │  Enviar  │                  │  Salvar  │
       │  SMTP    │                  │ Laravel  │
       │          │                  │Notifiable│
       └──────────┘                  └────┬─────┘
                                          │
                                          ▼
                                    ┌──────────┐
                                    │BROADCAST │
                                    │ (Reverb) │
                                    └────┬─────┘
                                         │
                                         ▼
                                    ┌──────────┐
                                    │ Frontend │
                                    │ Realtime │
                                    └──────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                     EVENTOS REALTIME                                         │
└─────────────────────────────────────────────────────────────────────────────┘

    Evento                    Canal                    Dados
    ─────────────────────────────────────────────────────────────────────
    task.created          →   user.{id}            →   task_id, title
                              group.{groupId}

    task.updated          →   user.{id}            →   task_id, status,
                              group.{groupId}          progress

    document.status_      →   user.{id}            →   document_id, status,
    changed                   group.{groupId}          reason

    notification.new      →   user.{id}            →   type, message, data
```

## 6. Fluxo de Permissoes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HIERARQUIA DE PERMISSOES                              │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌──────────────┐
                         │    OWNER     │
                         │  (Dono)      │
                         └──────┬───────┘
                                │
                    Todas as permissoes do grupo
                                │
                                ▼
                         ┌──────────────┐
                         │    ADMIN     │
                         │              │
                         └──────┬───────┘
                                │
                    Gerenciar tasks, docs,
                    usuarios, empresas
                                │
                                ▼
                         ┌──────────────┐
                         │   MEMBER     │
                         │              │
                         └──────────────┘
                                │
                    Ver tasks, enviar docs,
                    aprovar (se designado)


┌─────────────────────────────────────────────────────────────────────────────┐
│                        PERMISSOES DISPONIVEIS                                │
└─────────────────────────────────────────────────────────────────────────────┘

    Modulo          Permissoes
    ─────────────────────────────────────────────────────────────────────
    Tasks       →   view, create, update, delete, archive
    Documents   →   view, upload, approve, reject, delete
    Obligations →   view, create, update, delete, generate_tasks
    Companies   →   view, create, update, delete
    Teams       →   view, create, update, delete, manage_members
    Users       →   view, create, update, delete, invite, manage_roles
    Reports     →   view, export
    Dashboard   →   view, team_metrics, company_metrics
    System      →   settings, audit_logs
```

## 7. Fluxo de Checklists (Subtarefas)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE CHECKLISTS                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │    TAREFA    │
    │              │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   Adicionar  │
    │  Checklist   │
    │   (manual)   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────────────────────┐
    │         CHECKLIST ITEM                │
    │  - Titulo                            │
    │  - Status (pendente/andamento/done)  │
    │  - Ordem                             │
    │  - Responsavel (opcional)            │
    └──────────────┬───────────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
    ┌──────────┐     ┌──────────────┐
    │ Pendente │     │ Em Andamento │
    └────┬─────┘     └──────┬───────┘
         │                  │
         └────────┬─────────┘
                  │
                  ▼
           ┌──────────┐
           │Concluido │
           └────┬─────┘
                │
                ▼
    ┌──────────────────────────────────────┐
    │   Recalcular progresso da Tarefa     │
    │   progress = (concluidos / total)    │
    └──────────────────────────────────────┘
```

## 8. Fluxo Cron Jobs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CRON JOBS                                          │
└─────────────────────────────────────────────────────────────────────────────┘

    Job                     Frequencia          Descricao
    ─────────────────────────────────────────────────────────────────────
    update-task-status      A cada hora         Atualiza status de tarefas
                                                (new → pending → late)

    create-automatic-tasks  Diario 06:00        Gera tarefas automaticas
                                                das obrigacoes

    send-daily-notifications    Diario 08:00    Envia resumo diario
                                                (tarefas atrasadas/urgentes)

    send-weekly-notifications   Segunda 08:00   Envia resumo semanal
                                                (estatisticas da semana)

    send-monthly-notifications  Dia 1 08:00     Envia resumo mensal

    cleanup-old-notifications   Domingo 02:00   Remove notificacoes
                                                lidas > 3 meses

    cleanup-expired-mfa-codes   15 minutos      Limpa codigos MFA
                                                expirados


    ┌─────────────────────────────────────────────────────────────────────┐
    │                    COMO EXECUTAR                                     │
    │                                                                     │
    │  Em producao, adicione ao crontab:                                  │
    │                                                                     │
    │  * * * * * cd /path && php artisan schedule:run >> /dev/null 2>&1  │
    │                                                                     │
    │  Ou via Docker:                                                     │
    │                                                                     │
    │  docker exec tfu-laravel-php php artisan schedule:run              │
    └─────────────────────────────────────────────────────────────────────┘
```

## 9. Endpoints API Resumo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        API ENDPOINTS                                         │
└─────────────────────────────────────────────────────────────────────────────┘

    Auth
    ────────────────────────────────────────────────────────────────────────
    POST   /api/auth/login              Login
    POST   /api/auth/register           Registro
    POST   /api/auth/logout             Logout
    POST   /api/auth/forgot-password    Recuperar senha
    POST   /api/auth/reset-password     Resetar senha
    GET    /api/auth/user               Usuario atual
    PUT    /api/auth/user               Atualizar perfil
    PUT    /api/auth/user/password      Alterar senha

    MFA
    ────────────────────────────────────────────────────────────────────────
    GET    /api/auth/mfa/status         Status do MFA
    POST   /api/auth/mfa/setup          Configurar MFA
    POST   /api/auth/mfa/verify         Verificar codigo
    POST   /api/auth/mfa/confirm        Confirmar no login
    POST   /api/auth/mfa/disable        Desativar MFA
    POST   /api/auth/mfa/backup-codes   Gerar codigos backup

    Tasks
    ────────────────────────────────────────────────────────────────────────
    GET    /api/tasks                   Listar tarefas
    GET    /api/tasks/{id}              Ver tarefa
    PUT    /api/tasks/{id}              Atualizar
    GET    /api/tasks/method/{method}   Filtros especiais
    POST   /api/tasks/{id}/correct      Retificar
    POST   /api/tasks/{id}/archive      Arquivar
    POST   /api/tasks/{id}/unarchive    Desarquivar

    Checklists
    ────────────────────────────────────────────────────────────────────────
    GET    /api/tasks/{task}/checklists     Listar
    POST   /api/tasks/{task}/checklists     Criar
    PUT    /api/checklists/{id}             Atualizar
    DELETE /api/checklists/{id}             Excluir
    PATCH  /api/checklists/{id}/status      Alterar status

    Documents
    ────────────────────────────────────────────────────────────────────────
    GET    /api/documents                       Listar
    GET    /api/documents/{id}                  Ver
    POST   /api/documents/{id}/upload           Upload direto
    GET    /api/documents/{id}/upload-url       URL presigned S3
    POST   /api/documents/{id}/register-upload  Registrar upload S3
    POST   /api/documents/{id}/reset            Resetar documento
    POST   /api/documents/{id}/approve          Aprovar
    POST   /api/documents/{id}/reject           Rejeitar
    GET    /api/documents/{id}/download-url     URL download

    Obligations
    ────────────────────────────────────────────────────────────────────────
    GET    /api/obligations                         Listar
    POST   /api/obligations                         Criar
    GET    /api/obligations/{id}                    Ver
    PUT    /api/obligations/{id}                    Atualizar
    DELETE /api/obligations/{id}                    Excluir
    POST   /api/obligations/{id}/generate-tasks     Gerar tarefas
    GET    /api/obligations/{id}/preview-tasks      Preview

    Notifications
    ────────────────────────────────────────────────────────────────────────
    GET    /api/notifications               Listar
    GET    /api/notifications/unread-count  Contagem nao lidas
    POST   /api/notifications/mark-all-read Marcar todas lidas
    POST   /api/notifications/{id}/read     Marcar como lida
    DELETE /api/notifications/{id}          Excluir
    GET    /api/notifications/preferences   Ver preferencias
    PUT    /api/notifications/preferences   Atualizar preferencias
```
