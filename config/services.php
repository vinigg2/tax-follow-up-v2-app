<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Service Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the AI service provider and model to use.
    | Supported providers: openrouter, anthropic, openai
    |
    */

    'ai' => [
        // API URL (OpenRouter, Anthropic, or OpenAI)
        'url' => env('AI_API_URL', 'https://openrouter.ai/api/v1'),

        // API Key
        'key' => env('AI_API_KEY', env('OPENROUTER_API_KEY', env('ANTHROPIC_API_KEY'))),

        // Model to use
        // OpenRouter: anthropic/claude-3.5-sonnet, openai/gpt-4o, meta-llama/llama-3.1-70b-instruct
        // Anthropic: claude-3-5-sonnet-20241022
        // OpenAI: gpt-4o
        'model' => env('AI_MODEL', 'anthropic/claude-3.5-sonnet'),
    ],

];
