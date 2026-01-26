# Tax Follow Up

Sistema de gerenciamento de obrigacoes fiscais e tarefas para escritorios de contabilidade.

## Sobre o Projeto

O Tax Follow Up e uma plataforma completa para gerenciar obrigacoes fiscais, acompanhar prazos, controlar documentos e organizar o trabalho de equipes contabeis. O sistema permite:

- Gerenciar **obrigacoes fiscais** com geracao automatica de tarefas
- Controlar **prazos** e evitar atrasos
- Fazer **upload e aprovacao de documentos** com workflow configuravel
- Organizar **equipes** com diferentes niveis de acesso
- Acompanhar **metricas** e produtividade no dashboard
- Utilizar **assistente de IA** para automatizar processos e obter sugestoes

## Stack Tecnologica

### Backend
- **Laravel 11** - Framework PHP
- **MySQL 8** - Banco de dados
- **Sanctum** - Autenticacao API
- **Spatie Permissions** - Sistema de permissoes

### Frontend
- **React 18** com TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Estilizacao
- **Shadcn/ui** - Componentes UI
- **TanStack Query** - Gerenciamento de estado e cache
- **React Router** - Roteamento

## Requisitos

- PHP 8.2+
- Composer 2.x
- Node.js 20+
- MySQL 8.0+

## Instalacao

### 1. Clone o repositorio

```bash
git clone git@github.com:vinigg2/tax-follow-up-v2-app.git
cd tax-follow-up-v2-app
```

### 2. Instale as dependencias

```bash
# Backend
composer install

# Frontend
npm install
```

### 3. Configure o ambiente

```bash
cp .env.example .env
php artisan key:generate
```

Edite o `.env` com suas configuracoes de banco de dados.

### 4. Execute as migrations e seeders

```bash
php artisan migrate --seed
```

### 5. Inicie o servidor de desenvolvimento

```bash
# Backend (Laravel)
php artisan serve

# Frontend (Vite) - em outro terminal
npm run dev
```

Acesse: http://localhost:8000

## Usando Docker

```bash
# Subir os containers
docker-compose up -d

# Executar migrations
docker exec tfu-laravel-php php artisan migrate --seed
```

## Usuarios de Teste

Apos rodar os seeders:

| Email | Senha | Funcao |
|-------|-------|--------|
| admin@taxfollowup.com | password | Admin (Owner) |
| manager@taxfollowup.com | password | Manager |
| user@taxfollowup.com | password | Member |

## Sistema de Permissoes

O sistema possui tres niveis de acesso por grupo:

| Funcao | Descricao |
|--------|-----------|
| **Admin** | Acesso total: gerencia usuarios, empresas, obrigacoes, tarefas |
| **Manager** | Gerencia tarefas, obrigacoes e documentos. Nao pode gerenciar usuarios/empresas |
| **Member** | Apenas visualiza e faz upload de documentos para aprovacao |

## Estrutura do Projeto

```
├── app/
│   ├── Http/Controllers/     # Controllers da API
│   ├── Infrastructure/       # Models, Repositories
│   └── Mail/                 # Templates de email
├── database/
│   ├── migrations/           # Migrations do banco
│   └── seeders/              # Dados de teste
├── resources/js/
│   ├── api/                  # Camada de API (axios)
│   ├── components/           # Componentes React
│   ├── context/              # Contextos (Auth, etc)
│   ├── hooks/                # Custom hooks
│   ├── layouts/              # Layouts da aplicacao
│   └── pages/                # Paginas
├── routes/
│   ├── api.php               # Rotas da API
│   └── web.php               # Rotas web
└── tests/
    └── Feature/Api/          # Testes de API
```

## Comandos Uteis

```bash
# Rodar testes
php artisan test

# Build de producao
npm run build

# Verificar tipos TypeScript
npm run type-check

# Limpar caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

## Documentacao

- [Regras de Negocio](docs/BUSINESS_RULES.md)
- [Fluxos do Sistema](docs/FLUXOS.md)
- [Arquitetura Frontend](.docs/ARCHITECTURE.md)
- [Convencoes de Codigo](.docs/CONVENTIONS.md)

## Deploy

O deploy e feito automaticamente via GitHub Actions ao fazer push na branch `main`.

O workflow:
1. Build do frontend (npm run build)
2. Sync dos arquivos via rsync
3. Execucao das migrations

## Assistente de IA

O sistema possui um assistente de IA integrado que pode ajudar a automatizar tarefas. Para ativar, configure as variaveis no `.env`:

```env
# Usando OpenRouter (recomendado)
AI_API_URL=https://openrouter.ai/api/v1
AI_API_KEY=sua-chave-openrouter
AI_MODEL=anthropic/claude-3.5-sonnet

# Ou usando Anthropic diretamente
# AI_API_URL=https://api.anthropic.com/v1
# AI_API_KEY=sua-chave-anthropic
# AI_MODEL=claude-3-5-sonnet-20241022
```

O assistente pode:
- Criar tarefas e obrigacoes fiscais
- Analisar documentos anexados
- Sugerir acoes baseado no contexto da pagina
- Responder perguntas sobre o sistema

## Licenca

Projeto privado - Todos os direitos reservados.
