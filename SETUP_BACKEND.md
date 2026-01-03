# Tax Follow Up - Backend Setup

## Pacotes a Instalar

Execute os seguintes comandos para instalar as dependencias:

```bash
# MFA (Two-Factor Authentication)
composer require pragmarx/google2fa-laravel
composer require bacon/bacon-qr-code

# Permissoes (Spatie)
composer require spatie/laravel-permission

# Realtime (Laravel Reverb)
composer require laravel/reverb
```

## Publicar Configuracoes

```bash
# Spatie Permissions
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"

# Laravel Reverb
php artisan reverb:install

# Notifications table
php artisan notifications:table
```

## Executar Migrations

```bash
php artisan migrate
```

## Executar Seeders

```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
```

## Configuracao do .env

Adicione as seguintes variaveis ao seu arquivo `.env`:

```env
# SMTP Email
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@taxfollowup.com
MAIL_FROM_NAME="Tax Follow Up"

# Laravel Reverb (WebSocket)
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=tax-follow-up
REVERB_APP_KEY=your-app-key-here
REVERB_APP_SECRET=your-app-secret-here
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

## Iniciar Servidor Reverb (Desenvolvimento)

```bash
php artisan reverb:start
```

## Arquivos Criados

### Migrations
- `2024_01_01_000017_add_mfa_fields_to_users.php` - Campos MFA e is_active
- `2024_01_01_000018_create_checklists_table.php` - Tabela de checklists
- `2024_01_01_000019_create_notifications_table.php` - Tabela de notificacoes

### Controllers
- `app/Http/Controllers/Api/MfaController.php` - MFA endpoints
- `app/Http/Controllers/Api/ChecklistController.php` - Checklists CRUD
- `app/Http/Controllers/Api/NotificationController.php` - Notificacoes API

### Models
- `app/Infrastructure/Persistence/Models/Checklist.php`
- `app/Infrastructure/Persistence/Models/User.php` - Atualizado com HasRoles trait

### Mail
- `app/Mail/MfaCodeMail.php`
- `app/Mail/PasswordResetMail.php`
- `app/Mail/WelcomeMail.php`

### Views (Email Templates)
- `resources/views/emails/mfa-code.blade.php`
- `resources/views/emails/password-reset.blade.php`
- `resources/views/emails/welcome.blade.php`

### Notifications

- `app/Notifications/TaskDeadlineNotification.php` - Alertas de prazo
- `app/Notifications/TaskAssignedNotification.php` - Tarefa atribuida
- `app/Notifications/DocumentStatusNotification.php` - Status de documento
- `app/Notifications/DailySummaryNotification.php` - Resumo diario
- `app/Notifications/WeeklySummaryNotification.php` - Resumo semanal

### Events (Realtime Broadcast)

- `app/Events/TaskUpdated.php` - Tarefa atualizada
- `app/Events/TaskCreated.php` - Tarefa criada
- `app/Events/DocumentStatusChanged.php` - Status documento alterado
- `app/Events/NewNotification.php` - Nova notificacao

### Console

- `app/Console/Kernel.php` - Laravel Scheduler configurado

### Routes

- `routes/channels.php` - Canais de broadcast

### Config

- `config/broadcasting.php` - Configuracao Reverb

### Seeders

- `database/seeders/RolesAndPermissionsSeeder.php`

## Novas Rotas API

### MFA (Autenticacao)
```
POST /api/auth/mfa/setup          - Configurar MFA (TOTP ou Email)
POST /api/auth/mfa/verify         - Verificar e ativar MFA
POST /api/auth/mfa/confirm        - Confirmar MFA durante login
POST /api/auth/mfa/disable        - Desativar MFA
POST /api/auth/mfa/backup-codes   - Gerar codigos de backup
POST /api/auth/mfa/send-email-otp - Reenviar codigo por email
GET  /api/auth/mfa/status         - Status do MFA
```

### Checklists
```
GET    /api/tasks/{task}/checklists        - Listar checklists
POST   /api/tasks/{task}/checklists        - Criar checklist
PATCH  /api/tasks/{task}/checklists/reorder - Reordenar
PUT    /api/checklists/{checklist}         - Atualizar
DELETE /api/checklists/{checklist}         - Remover
PATCH  /api/checklists/{checklist}/status  - Atualizar status
```

### Teams (Alias para Groups)
```
GET    /api/teams              - Listar times
POST   /api/teams              - Criar time
GET    /api/teams/{id}         - Ver time
PUT    /api/teams/{id}         - Atualizar time
DELETE /api/teams/{id}         - Remover time
GET    /api/teams/{id}/members - Listar membros
```

### Users (CRUD Completo)
```
GET    /api/users                      - Listar usuarios
POST   /api/users                      - Criar usuario
GET    /api/users/{id}                 - Ver usuario
PUT    /api/users/{id}                 - Atualizar usuario
DELETE /api/users/{id}                 - Desativar usuario
PATCH  /api/users/{id}/toggle-active   - Ativar/Desativar
PUT    /api/users/{id}/password        - Alterar senha
```

## Fluxo de Login com MFA

1. Usuario envia email/senha para `/api/auth/login`
2. Se MFA ativado:
   - Retorna `{ requires_mfa: true, mfa_method: 'totp'|'email', temp_token: '...' }`
   - Se email: codigo enviado automaticamente
3. Frontend exibe tela de codigo
4. Usuario envia codigo para `/api/auth/mfa/confirm` com `temp_token`
5. Se valido, retorna token Sanctum

## Permissoes Disponiveis (Spatie)

### Roles
- `owner` - Acesso total
- `admin` - Acesso administrativo (sem system settings)
- `member` - Acesso basico

### Permissions
- Tasks: `tasks.view`, `tasks.create`, `tasks.update`, `tasks.delete`, `tasks.archive`, `tasks.assign`
- Documents: `documents.view`, `documents.upload`, `documents.approve`, `documents.reject`, `documents.delete`
- Obligations: `obligations.view`, `obligations.create`, `obligations.update`, `obligations.delete`, `obligations.generate_tasks`
- Companies: `companies.view`, `companies.create`, `companies.update`, `companies.delete`
- Teams: `teams.view`, `teams.create`, `teams.update`, `teams.delete`, `teams.manage_members`
- Users: `users.view`, `users.create`, `users.update`, `users.delete`, `users.invite`, `users.manage_roles`
- Reports: `reports.view`, `reports.export`, `dashboard.view`, `dashboard.team_metrics`, `dashboard.company_metrics`
- System: `system.settings`, `system.audit_logs`

### Notifications API

```
GET    /api/notifications                  - Listar notificacoes
GET    /api/notifications/unread-count     - Contagem de nao lidas
POST   /api/notifications/mark-all-read    - Marcar todas como lidas
POST   /api/notifications/{id}/read        - Marcar como lida
DELETE /api/notifications/read             - Excluir lidas
DELETE /api/notifications/{id}             - Excluir notificacao
GET    /api/notifications/preferences      - Ver preferencias
PUT    /api/notifications/preferences      - Atualizar preferencias
```

## Laravel Scheduler (Cron)

O scheduler esta configurado em `app/Console/Kernel.php`:

| Tarefa | Frequencia | Descricao |
|--------|------------|-----------|
| `update-task-status` | A cada hora | Atualiza status de tarefas atrasadas |
| `create-automatic-tasks` | Diario 6:00 | Gera tarefas de obrigacoes |
| `send-daily-notifications` | Diario 8:00 | Envia resumo diario |
| `send-weekly-notifications` | Segunda 8:00 | Envia resumo semanal |
| `send-monthly-notifications` | Dia 1 8:00 | Envia resumo mensal |
| `cleanup-old-notifications` | Domingo 2:00 | Remove notificacoes antigas |
| `cleanup-expired-mfa-codes` | 15 min | Limpa codigos MFA expirados |

Para rodar o scheduler em producao, adicione ao crontab:

```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

## Broadcast Channels (Realtime)

Canais configurados em `routes/channels.php`:

| Canal | Descricao |
|-------|-----------|
| `user.{id}` | Notificacoes do usuario |
| `group.{groupId}` | Notificacoes do grupo/time |
| `task.{taskId}` | Atualizacoes da tarefa |
| `company.{companyId}` | Atualizacoes da empresa |

## Status da Implementacao

| Modulo | Status |
|--------|--------|
| Autenticacao (Login/Register/Logout) | Completo |
| Recuperacao de Senha | Completo |
| MFA (TOTP + Email OTP) | Completo |
| Permissoes (Spatie) | Completo |
| Obrigacoes CRUD | Completo |
| Tasks CRUD + Checklists | Completo |
| Empresas CRUD | Completo |
| Times/Grupos CRUD | Completo |
| Usuarios CRUD | Completo |
| Dashboard/Metricas | Completo |
| Notificacoes | Completo |
| Cron/Scheduler | Completo |
| Realtime (Reverb) | Completo |
