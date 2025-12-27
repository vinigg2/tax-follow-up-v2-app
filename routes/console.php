<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
*/

// Update task status (check delayed tasks)
Schedule::command('tasks:update-status')
    ->dailyAt('00:01')
    ->timezone('America/Sao_Paulo')
    ->withoutOverlapping();

// Generate automatic tasks
Schedule::command('tasks:generate-automatic')
    ->dailyAt('00:05')
    ->timezone('America/Sao_Paulo')
    ->withoutOverlapping();

// Send daily notifications
Schedule::command('notifications:send-daily')
    ->dailyAt('08:00')
    ->timezone('America/Sao_Paulo')
    ->withoutOverlapping();

// Send weekly notifications (Monday)
Schedule::command('notifications:send-weekly')
    ->weeklyOn(1, '08:00')
    ->timezone('America/Sao_Paulo')
    ->withoutOverlapping();

// Send monthly notifications (First day of month)
Schedule::command('notifications:send-monthly')
    ->monthlyOn(1, '08:00')
    ->timezone('America/Sao_Paulo')
    ->withoutOverlapping();
