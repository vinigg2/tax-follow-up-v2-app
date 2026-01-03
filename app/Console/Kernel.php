<?php

namespace App\Console;

use App\Http\Controllers\Api\CronController;
use App\Application\Services\TaskGenerationService;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Update task status based on deadlines - runs every hour
        $schedule->call(function () {
            $controller = app(CronController::class);
            $controller->updateTaskStatus(request());
        })->hourly()->name('update-task-status')->withoutOverlapping();

        // Create automatic tasks from obligations - runs daily at 6:00 AM
        $schedule->call(function () {
            $controller = app(CronController::class);
            $controller->createAutomaticTasks(request());
        })->dailyAt('06:00')->name('create-automatic-tasks')->withoutOverlapping();

        // Send daily notifications - runs daily at 8:00 AM
        $schedule->call(function () {
            $controller = app(CronController::class);
            $controller->sendDailyNotifications(request());
        })->dailyAt('08:00')->name('send-daily-notifications')->withoutOverlapping();

        // Send weekly notifications - runs every Monday at 8:00 AM
        $schedule->call(function () {
            $controller = app(CronController::class);
            $controller->sendWeeklyNotifications(request());
        })->weeklyOn(1, '08:00')->name('send-weekly-notifications')->withoutOverlapping();

        // Send monthly notifications - runs on the 1st of each month at 8:00 AM
        $schedule->call(function () {
            $controller = app(CronController::class);
            $controller->sendMonthlyNotifications(request());
        })->monthlyOn(1, '08:00')->name('send-monthly-notifications')->withoutOverlapping();

        // Clean up old notifications - runs weekly on Sunday at 2:00 AM
        $schedule->call(function () {
            \Illuminate\Support\Facades\DB::table('notifications')
                ->whereNotNull('read_at')
                ->where('read_at', '<', now()->subMonths(3))
                ->delete();
        })->weeklyOn(0, '02:00')->name('cleanup-old-notifications');

        // Clean up expired MFA codes - runs every 15 minutes
        $schedule->call(function () {
            \App\Infrastructure\Persistence\Models\User::query()
                ->whereNotNull('email_otp')
                ->where('email_otp_expires_at', '<', now())
                ->update([
                    'email_otp' => null,
                    'email_otp_expires_at' => null,
                ]);
        })->everyFifteenMinutes()->name('cleanup-expired-mfa-codes');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
