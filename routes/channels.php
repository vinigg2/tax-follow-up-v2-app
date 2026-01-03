<?php

use App\Infrastructure\Persistence\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

/**
 * Private channel for individual user notifications
 */
Broadcast::channel('user.{id}', function (User $user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Private channel for group/team notifications
 */
Broadcast::channel('group.{groupId}', function (User $user, $groupId) {
    return in_array((int) $groupId, $user->accessibleGroupIds());
});

/**
 * Private channel for task updates
 */
Broadcast::channel('task.{taskId}', function (User $user, $taskId) {
    $task = \App\Infrastructure\Persistence\Models\Task::find($taskId);

    if (!$task) {
        return false;
    }

    // User is responsible for the task
    if ($task->responsible === $user->id) {
        return true;
    }

    // User is in the same group
    return in_array($task->group_id, $user->accessibleGroupIds());
});

/**
 * Private channel for company updates
 */
Broadcast::channel('company.{companyId}', function (User $user, $companyId) {
    $company = \App\Infrastructure\Persistence\Models\Company::find($companyId);

    if (!$company) {
        return false;
    }

    return in_array($company->group_id, $user->accessibleGroupIds());
});
