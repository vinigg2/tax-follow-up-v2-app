<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Task Status Constants
    |--------------------------------------------------------------------------
    */
    'task_status' => [
        'new' => 'new',
        'pending' => 'pending',
        'delayed' => 'late',
        'finished' => 'finished',
        'corrected' => 'rectified',
    ],

    /*
    |--------------------------------------------------------------------------
    | Document Status Constants
    |--------------------------------------------------------------------------
    */
    'document_status' => [
        'unstarted' => 'unstarted',
        'pending_file' => 'pending_file',
        'started' => 'started',
        'on_approval' => 'on_approval',
        'restarted' => 'restarted',
        'finished' => 'finished',
    ],

    /*
    |--------------------------------------------------------------------------
    | Obligation Frequency Constants
    |--------------------------------------------------------------------------
    */
    'frequency' => [
        'monthly' => 'MM',
        'quarterly' => 'QT',
        'annual' => 'AA',
    ],

    /*
    |--------------------------------------------------------------------------
    | Approval Status Constants
    |--------------------------------------------------------------------------
    */
    'approval_status' => [
        'not_required' => 'N',
        'sequence' => 'S',
        'parallel' => 'P',
    ],

    /*
    |--------------------------------------------------------------------------
    | Timeline Event Types
    |--------------------------------------------------------------------------
    */
    'timeline_types' => [
        'started' => 'started',
        'finished' => 'finished',
        'send_file' => 'send_file',
        'request_approval' => 'request_approval',
        'approved' => 'approved',
        'rejected' => 'rejected',
        'reset_document' => 'reset_document',
        'correct_task' => 'correct_task',
        'archived_task' => 'archived_task',
        'unarchived_task' => 'unarchived_task',
        'changed_title' => 'changed_title',
        'changed_description' => 'changed_description',
        'changed_deadline' => 'changed_deadline',
        'changed_responsible' => 'changed_responsible',
        'free_text' => 'free_text',
    ],

    /*
    |--------------------------------------------------------------------------
    | Time Configuration
    |--------------------------------------------------------------------------
    */
    'time_to_pending_days' => 7, // Days before deadline to mark as pending

    /*
    |--------------------------------------------------------------------------
    | User Roles in Group
    |--------------------------------------------------------------------------
    */
    'roles' => [
        'owner' => 'owner',
        'admin' => 'admin',
        'member' => 'member',
    ],

    /*
    |--------------------------------------------------------------------------
    | Countries List (ISO 3166-1 alpha-2)
    |--------------------------------------------------------------------------
    */
    'countries' => [
        'BR' => 'Brasil',
        'US' => 'United States',
        'PT' => 'Portugal',
        'ES' => 'Spain',
        'AR' => 'Argentina',
        'CL' => 'Chile',
        'CO' => 'Colombia',
        'MX' => 'Mexico',
        'PE' => 'Peru',
        'UY' => 'Uruguay',
    ],

    /*
    |--------------------------------------------------------------------------
    | Pagination Defaults
    |--------------------------------------------------------------------------
    */
    'pagination' => [
        'per_page' => 20,
        'max_per_page' => 100,
    ],

    /*
    |--------------------------------------------------------------------------
    | File Upload Configuration
    |--------------------------------------------------------------------------
    */
    'upload' => [
        'max_size_mb' => 50,
        'allowed_extensions' => [
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
            'jpg', 'jpeg', 'png', 'gif',
            'zip', 'rar', '7z',
            'txt', 'csv',
        ],
        'presigned_url_expiration_minutes' => 10,
    ],
];
