<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\ObligationController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TimelineController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DocumentTypeController;
use App\Http\Controllers\Api\ApproverController;
use App\Http\Controllers\Api\CronController;
use App\Http\Controllers\Api\MfaController;
use App\Http\Controllers\Api\ChecklistController;
use App\Http\Controllers\Api\NotificationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Auth routes (public)
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    // MFA routes (public - for login flow)
    Route::prefix('mfa')->group(function () {
        Route::post('confirm', [MfaController::class, 'confirm']);
        Route::post('send-email-otp', [MfaController::class, 'sendEmailOtp']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('user', [AuthController::class, 'user']);
        Route::put('user', [AuthController::class, 'updateProfile']);
        Route::put('user/password', [AuthController::class, 'updatePassword']);

        // MFA routes (authenticated - for setup)
        Route::prefix('mfa')->group(function () {
            Route::get('status', [MfaController::class, 'status']);
            Route::post('setup', [MfaController::class, 'setup']);
            Route::post('verify', [MfaController::class, 'verify']);
            Route::post('disable', [MfaController::class, 'disable']);
            Route::post('backup-codes', [MfaController::class, 'generateBackupCodes']);
        });
    });
});

// Protected API routes
Route::middleware(['auth:sanctum', 'tenant'])->group(function () {

    // Tasks
    Route::apiResource('tasks', TaskController::class);
    Route::get('tasks/method/{method}', [TaskController::class, 'byMethod']);
    Route::post('tasks/{task}/correct', [TaskController::class, 'correct']);
    Route::post('tasks/{task}/archive', [TaskController::class, 'archive']);
    Route::post('tasks/{task}/unarchive', [TaskController::class, 'unarchive']);
    Route::get('tasks/{task}/timeline', [TimelineController::class, 'index']);
    Route::post('tasks/{task}/timeline', [TimelineController::class, 'store']);

    // Checklists (Subtasks)
    Route::get('tasks/{task}/checklists', [ChecklistController::class, 'index']);
    Route::post('tasks/{task}/checklists', [ChecklistController::class, 'store']);
    Route::patch('tasks/{task}/checklists/reorder', [ChecklistController::class, 'reorder']);
    Route::put('checklists/{checklist}', [ChecklistController::class, 'update']);
    Route::delete('checklists/{checklist}', [ChecklistController::class, 'destroy']);
    Route::patch('checklists/{checklist}/status', [ChecklistController::class, 'updateStatus']);

    // Obligations
    Route::apiResource('obligations', ObligationController::class);
    Route::post('obligations/{obligation}/generate-tasks', [ObligationController::class, 'generateTasks']);
    Route::get('obligations/{obligation}/preview-tasks', [ObligationController::class, 'previewTasks']);
    Route::post('obligations/{obligation}/dynamic-fields', [ObligationController::class, 'updateDynamicFields']);
    Route::delete('obligations/{obligation}/dynamic-fields/{field}', [ObligationController::class, 'deleteDynamicField']);
    Route::post('obligations/{obligation}/flowchart', [ObligationController::class, 'updateFlowchart']);

    // Documents
    Route::apiResource('documents', DocumentController::class);
    Route::post('documents/{document}/upload', [DocumentController::class, 'upload']);
    Route::get('documents/{document}/upload-url', [DocumentController::class, 'getUploadUrl']);
    Route::post('documents/{document}/register-upload', [DocumentController::class, 'registerUpload']);
    Route::post('documents/{document}/reset', [DocumentController::class, 'reset']);
    Route::post('documents/{document}/approve', [DocumentController::class, 'approve']);
    Route::post('documents/{document}/reject', [DocumentController::class, 'reject']);
    Route::get('documents/{document}/download-url', [DocumentController::class, 'getDownloadUrl']);

    // Document Types
    Route::apiResource('document-types', DocumentTypeController::class);
    Route::post('document-types/{documentType}/approvers', [ApproverController::class, 'store']);
    Route::put('document-types/{documentType}/approvers/{approver}', [ApproverController::class, 'update']);
    Route::delete('document-types/{documentType}/approvers/{approver}', [ApproverController::class, 'destroy']);
    Route::post('document-types/{documentType}/approvers/reorder', [ApproverController::class, 'reorder']);

    // Companies
    Route::apiResource('companies', CompanyController::class);

    // Groups (Teams)
    Route::apiResource('groups', GroupController::class);
    Route::get('groups/{group}/users', [GroupController::class, 'users']);
    Route::post('groups/{group}/invite', [InvitationController::class, 'store']);
    Route::delete('groups/{group}/users/{user}', [GroupController::class, 'removeUser']);
    Route::put('groups/{group}/users/{user}/role', [GroupController::class, 'updateUserRole']);

    // Teams (alias for groups - frontend compatibility)
    Route::prefix('teams')->group(function () {
        Route::get('/', [GroupController::class, 'index']);
        Route::post('/', [GroupController::class, 'store']);
        Route::get('/{group}', [GroupController::class, 'show']);
        Route::put('/{group}', [GroupController::class, 'update']);
        Route::delete('/{group}', [GroupController::class, 'destroy']);
        Route::get('/{group}/users', [GroupController::class, 'users']);
        Route::get('/{group}/members', [GroupController::class, 'users']); // Alias
        Route::post('/{group}/invite', [InvitationController::class, 'store']);
        Route::delete('/{group}/users/{user}', [GroupController::class, 'removeUser']);
        Route::delete('/{group}/members/{user}', [GroupController::class, 'removeUser']); // Alias
        Route::put('/{group}/users/{user}/role', [GroupController::class, 'updateUserRole']);
    });

    // Users
    Route::apiResource('users', UserController::class);
    Route::put('users/{user}/notifications', [UserController::class, 'updateNotifications']);
    Route::post('users/{user}/avatar', [UserController::class, 'uploadAvatar']);
    Route::patch('users/{user}/toggle-active', [UserController::class, 'toggleActive']);
    Route::put('users/{user}/password', [UserController::class, 'updatePassword']);

    // Dashboard
    Route::prefix('dashboard')->group(function () {
        Route::get('overview', [DashboardController::class, 'overview']);
        Route::get('teams', [DashboardController::class, 'teams']);
        Route::get('teams/{team}/status', [DashboardController::class, 'teamStatus']);
        Route::get('companies', [DashboardController::class, 'companies']);
        Route::get('companies/{company}/status', [DashboardController::class, 'companyStatus']);
        Route::get('calendar', [DashboardController::class, 'calendar']);
        Route::get('performance', [DashboardController::class, 'performance']);
    });

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::post('{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::delete('read', [NotificationController::class, 'destroyRead']);
        Route::delete('{notification}', [NotificationController::class, 'destroy']);
        Route::get('preferences', [NotificationController::class, 'getPreferences']);
        Route::put('preferences', [NotificationController::class, 'updatePreferences']);
    });

    // Invitations
    Route::get('invitations', [InvitationController::class, 'index']);
    Route::delete('invitations/{invitation}', [InvitationController::class, 'destroy']);
});

// Invitation accept (authenticated but not requiring tenant)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('invitations/{code}/accept', [InvitationController::class, 'accept']);
    Route::get('invitations/{code}', [InvitationController::class, 'show']);
});

// Public routes (cron jobs, webhooks)
Route::prefix('cron')->middleware('throttle:10,1')->group(function () {
    Route::post('update-task-status', [CronController::class, 'updateTaskStatus']);
    Route::post('create-automatic-tasks', [CronController::class, 'createAutomaticTasks']);
    Route::post('send-daily-notifications', [CronController::class, 'sendDailyNotifications']);
    Route::post('send-weekly-notifications', [CronController::class, 'sendWeeklyNotifications']);
    Route::post('send-monthly-notifications', [CronController::class, 'sendMonthlyNotifications']);
});
