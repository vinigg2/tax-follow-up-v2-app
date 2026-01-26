<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function __construct(
        private AIService $aiService
    ) {}

    /**
     * Handle AI chat messages
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:4000',
            'context' => 'required|array',
            'conversationId' => 'nullable|string',
        ]);

        $user = $request->user();
        $message = $request->input('message');
        $context = $request->input('context');
        $conversationId = $request->input('conversationId');

        // Check if AI is configured
        if (!$this->aiService->isConfigured()) {
            return response()->json([
                'message' => 'Assistente de IA nao configurado. Entre em contato com o administrador.',
                'conversationId' => $conversationId ?? uniqid('conv_'),
            ], 503);
        }

        try {
            $response = $this->aiService->chat(
                $user,
                $message,
                $context,
                $conversationId
            );

            return response()->json($response);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao processar mensagem: ' . $e->getMessage(),
                'conversationId' => $conversationId ?? uniqid('conv_'),
            ], 500);
        }
    }

    /**
     * Execute an AI action
     */
    public function executeAction(Request $request): JsonResponse
    {
        $request->validate([
            'action' => 'required|array',
            'action.type' => 'required|string',
            'action.data' => 'nullable|array',
        ]);

        $user = $request->user();
        $action = $request->input('action');

        try {
            $result = $this->aiService->executeAction($user, $action);

            return response()->json([
                'success' => true,
                'result' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Analyze a document with AI
     */
    public function analyzeDocument(Request $request, int $documentId): JsonResponse
    {
        $request->validate([
            'prompt' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $prompt = $request->input('prompt');

        try {
            $analysis = $this->aiService->analyzeDocument($user, $documentId, $prompt);

            return response()->json([
                'analysis' => $analysis,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get AI suggestions for a task
     */
    public function getTaskSuggestions(Request $request, int $taskId): JsonResponse
    {
        $user = $request->user();

        try {
            $suggestions = $this->aiService->getTaskSuggestions($user, $taskId);

            return response()->json([
                'suggestions' => $suggestions,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Generate obligation from natural language description
     */
    public function generateObligation(Request $request): JsonResponse
    {
        $request->validate([
            'description' => 'required|string|max:1000',
        ]);

        $description = $request->input('description');

        try {
            $obligation = $this->aiService->generateObligation($description);

            return response()->json($obligation);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
