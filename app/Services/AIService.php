<?php

namespace App\Services;

use App\Infrastructure\Persistence\Models\User;
use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\Document;
use App\Infrastructure\Persistence\Models\Obligation;
use App\Infrastructure\Persistence\Models\Company;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class AIService
{
    private string $apiUrl;
    private string $apiKey;
    private string $model;

    public function __construct()
    {
        $this->apiUrl = config('services.ai.url', 'https://openrouter.ai/api/v1');
        $this->apiKey = config('services.ai.key', env('OPENROUTER_API_KEY', env('ANTHROPIC_API_KEY')));
        $this->model = config('services.ai.model', 'anthropic/claude-3.5-sonnet');
    }

    /**
     * Chat with AI
     */
    public function chat(User $user, string $message, array $context, ?string $conversationId = null): array
    {
        $conversationId = $conversationId ?? uniqid('conv_');

        // Build system prompt with context
        $systemPrompt = $this->buildSystemPrompt($user, $context);

        // Get conversation history from cache
        $history = Cache::get("ai_conversation_{$conversationId}", []);

        // Add user message to history
        $history[] = [
            'role' => 'user',
            'content' => $message,
        ];

        // Call AI API
        $response = $this->callAI($systemPrompt, $history);

        // Parse response for actions
        $parsedResponse = $this->parseResponse($response);

        // Add assistant message to history
        $history[] = [
            'role' => 'assistant',
            'content' => $response,
        ];

        // Keep only last 20 messages
        if (count($history) > 20) {
            $history = array_slice($history, -20);
        }

        // Cache conversation history for 1 hour
        Cache::put("ai_conversation_{$conversationId}", $history, 3600);

        return [
            'message' => $parsedResponse['message'],
            'action' => $parsedResponse['action'] ?? null,
            'conversationId' => $conversationId,
        ];
    }

    /**
     * Build system prompt with context
     */
    private function buildSystemPrompt(User $user, array $context): string
    {
        $prompt = <<<PROMPT
Voce e um assistente de IA para o sistema Tax Follow Up, uma plataforma de gerenciamento de obrigacoes fiscais.

## Informacoes do Usuario
- Nome: {$user->name}
- Email: {$user->email}

## Contexto Atual
PROMPT;

        if (!empty($context['page'])) {
            $prompt .= "\n- Pagina: {$context['page']}";
        }

        if (!empty($context['selectedGroup'])) {
            $prompt .= "\n- Grupo: {$context['selectedGroup']['name']} (ID: {$context['selectedGroup']['id']})";
        }

        if (!empty($context['task'])) {
            $task = $context['task'];
            $prompt .= "\n\n### Tarefa Atual";
            $prompt .= "\n- Titulo: {$task['title']}";
            $prompt .= "\n- Status: {$task['status']}";
            $prompt .= "\n- Empresa: {$task['company']}";
            $prompt .= "\n- Prazo: {$task['deadline']}";
            if (!empty($task['responsible'])) {
                $prompt .= "\n- Responsavel: {$task['responsible']}";
            }
            if (!empty($task['documents'])) {
                $prompt .= "\n- Documentos: " . count($task['documents']);
            }
        }

        if (!empty($context['company'])) {
            $company = $context['company'];
            $prompt .= "\n\n### Empresa Atual";
            $prompt .= "\n- Nome: {$company['name']}";
            if (!empty($company['cnpj'])) {
                $prompt .= "\n- CNPJ: {$company['cnpj']}";
            }
        }

        $prompt .= <<<PROMPT


## Suas Capacidades
Voce pode:
1. Responder perguntas sobre obrigacoes fiscais brasileiras
2. Ajudar a criar tarefas e obrigacoes
3. Analisar documentos
4. Sugerir acoes baseadas no contexto
5. Fornecer resumos e status

## Acoes Disponiveis
Quando o usuario pedir para executar uma acao, responda com JSON no formato:
```json
{"action": {"type": "tipo_acao", "description": "descricao", "data": {...}, "requiresConfirmation": true}}
```

Tipos de acao:
- create_task: Criar tarefa (data: title, description, deadline, company_id, responsible)
- update_task: Atualizar tarefa (data: task_id, fields...)
- create_obligation: Criar obrigacao (data: title, frequency, day_deadline, period)
- change_status: Mudar status (data: task_id, status)
- assign_responsible: Atribuir responsavel (data: task_id, user_id)
- navigate: Navegar para pagina (data: path)

## Regras
- Sempre responda em portugues brasileiro
- Seja conciso e objetivo
- Para acoes destrutivas ou criacao, sempre defina requiresConfirmation: true
- Se nao tiver certeza, pergunte antes de sugerir acoes
- Formate datas no padrao brasileiro (DD/MM/YYYY)
PROMPT;

        return $prompt;
    }

    /**
     * Call AI API
     */
    private function callAI(string $systemPrompt, array $messages): string
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
            'HTTP-Referer' => config('app.url'),
            'X-Title' => 'Tax Follow Up',
        ])->post($this->apiUrl . '/chat/completions', [
            'model' => $this->model,
            'messages' => array_merge(
                [['role' => 'system', 'content' => $systemPrompt]],
                $messages
            ),
            'max_tokens' => 2048,
            'temperature' => 0.7,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Erro na API de IA: ' . $response->body());
        }

        $data = $response->json();
        return $data['choices'][0]['message']['content'] ?? '';
    }

    /**
     * Parse AI response for actions
     */
    private function parseResponse(string $response): array
    {
        // Check if response contains JSON action
        if (preg_match('/```json\s*(\{.*?\})\s*```/s', $response, $matches)) {
            $json = json_decode($matches[1], true);
            if ($json && isset($json['action'])) {
                // Remove JSON block from message
                $message = trim(preg_replace('/```json\s*\{.*?\}\s*```/s', '', $response));
                return [
                    'message' => $message ?: 'Acao identificada.',
                    'action' => $json['action'],
                ];
            }
        }

        return ['message' => $response];
    }

    /**
     * Execute an action
     */
    public function executeAction(User $user, array $action): array
    {
        $type = $action['type'];
        $data = $action['data'] ?? [];

        return match ($type) {
            'create_task' => $this->createTask($user, $data),
            'update_task' => $this->updateTask($user, $data),
            'create_obligation' => $this->createObligation($user, $data),
            'change_status' => $this->changeStatus($user, $data),
            'assign_responsible' => $this->assignResponsible($user, $data),
            default => throw new \Exception("Tipo de acao desconhecido: {$type}"),
        };
    }

    /**
     * Create a task
     */
    private function createTask(User $user, array $data): array
    {
        $groupIds = $user->accessibleGroupIds();
        if (empty($groupIds)) {
            throw new \Exception('Usuario nao tem acesso a nenhum grupo');
        }

        $task = Task::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'deadline' => $data['deadline'],
            'status' => 'new',
            'company_id' => $data['company_id'],
            'group_id' => $data['group_id'] ?? $groupIds[0],
            'responsible' => $data['responsible'] ?? $user->id,
            'is_active' => true,
        ]);

        return ['task_id' => $task->id];
    }

    /**
     * Update a task
     */
    private function updateTask(User $user, array $data): array
    {
        $task = Task::whereIn('group_id', $user->accessibleGroupIds())
            ->findOrFail($data['task_id']);

        unset($data['task_id']);
        $task->update($data);

        return ['task_id' => $task->id];
    }

    /**
     * Create an obligation
     */
    private function createObligation(User $user, array $data): array
    {
        $groupIds = $user->accessibleGroupIds();
        if (empty($groupIds)) {
            throw new \Exception('Usuario nao tem acesso a nenhum grupo');
        }

        $obligation = Obligation::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'frequency' => $data['frequency'],
            'day_deadline' => $data['day_deadline'],
            'month_deadline' => $data['month_deadline'] ?? null,
            'period' => $data['period'] ?? 1,
            'group_id' => $data['group_id'] ?? $groupIds[0],
            'generate_automatic_tasks' => $data['generate_automatic_tasks'] ?? true,
            'show_dashboard' => true,
        ]);

        return ['obligation_id' => $obligation->id];
    }

    /**
     * Change task status
     */
    private function changeStatus(User $user, array $data): array
    {
        $task = Task::whereIn('group_id', $user->accessibleGroupIds())
            ->findOrFail($data['task_id']);

        $task->update(['status' => $data['status']]);

        return ['task_id' => $task->id, 'status' => $data['status']];
    }

    /**
     * Assign responsible to task
     */
    private function assignResponsible(User $user, array $data): array
    {
        $task = Task::whereIn('group_id', $user->accessibleGroupIds())
            ->findOrFail($data['task_id']);

        $task->update(['responsible' => $data['user_id']]);

        return ['task_id' => $task->id, 'responsible' => $data['user_id']];
    }

    /**
     * Analyze a document
     */
    public function analyzeDocument(User $user, int $documentId, ?string $prompt = null): string
    {
        $document = Document::whereIn('group_id', $user->accessibleGroupIds())
            ->with('task')
            ->findOrFail($documentId);

        $analysisPrompt = $prompt ?? "Analise este documento e me diga se esta correto para a tarefa '{$document->task->title}'.";

        // For now, return a placeholder - real implementation would use vision API
        return "Documento: {$document->name}\n\nAnalise: O documento precisa ser verificado manualmente. Funcionalidade de analise visual sera implementada em breve.";
    }

    /**
     * Get suggestions for a task
     */
    public function getTaskSuggestions(User $user, int $taskId): array
    {
        $task = Task::whereIn('group_id', $user->accessibleGroupIds())
            ->with(['documents', 'company', 'checklists'])
            ->findOrFail($taskId);

        $suggestions = [];

        // Check documents status
        $pendingDocs = $task->documents->where('status', '!=', 'finished')->count();
        if ($pendingDocs > 0) {
            $suggestions[] = "Existem {$pendingDocs} documento(s) pendente(s) para esta tarefa.";
        }

        // Check deadline
        $deadline = \Carbon\Carbon::parse($task->deadline);
        $daysUntil = now()->diffInDays($deadline, false);
        if ($daysUntil < 0) {
            $suggestions[] = "A tarefa esta atrasada ha " . abs($daysUntil) . " dia(s).";
        } elseif ($daysUntil <= 3) {
            $suggestions[] = "O prazo vence em {$daysUntil} dia(s). Priorize esta tarefa.";
        }

        // Check checklists
        $pendingChecklists = $task->checklists->where('is_completed', false)->count();
        if ($pendingChecklists > 0) {
            $suggestions[] = "Ha {$pendingChecklists} item(ns) de checklist pendente(s).";
        }

        if (empty($suggestions)) {
            $suggestions[] = "Tarefa em bom andamento. Continue assim!";
        }

        return $suggestions;
    }

    /**
     * Generate obligation from natural language
     */
    public function generateObligation(string $description): array
    {
        $systemPrompt = <<<PROMPT
Voce e um especialista em obrigacoes fiscais brasileiras.
Dada uma descricao em linguagem natural, extraia as informacoes para criar uma obrigacao fiscal.

Responda APENAS com JSON no formato:
{
    "title": "Nome da obrigacao",
    "frequency": "MM" ou "QT" ou "AA",
    "dayDeadline": numero (1-31),
    "period": numero (meses apos competencia),
    "description": "descricao breve"
}

Frequencias:
- MM = Mensal
- QT = Trimestral
- AA = Anual
PROMPT;

        $response = $this->callAI($systemPrompt, [
            ['role' => 'user', 'content' => $description],
        ]);

        // Parse JSON from response
        if (preg_match('/\{[^{}]*\}/s', $response, $matches)) {
            $data = json_decode($matches[0], true);
            if ($data) {
                return $data;
            }
        }

        throw new \Exception('Nao foi possivel interpretar a descricao');
    }
}
