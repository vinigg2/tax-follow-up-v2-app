<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Tasks
            'tasks.view',
            'tasks.create',
            'tasks.update',
            'tasks.delete',
            'tasks.archive',
            'tasks.assign',

            // Documents
            'documents.view',
            'documents.upload',
            'documents.approve',
            'documents.reject',
            'documents.delete',

            // Obligations
            'obligations.view',
            'obligations.create',
            'obligations.update',
            'obligations.delete',
            'obligations.generate_tasks',

            // Companies
            'companies.view',
            'companies.create',
            'companies.update',
            'companies.delete',

            // Teams/Groups
            'teams.view',
            'teams.create',
            'teams.update',
            'teams.delete',
            'teams.manage_members',

            // Users
            'users.view',
            'users.create',
            'users.update',
            'users.delete',
            'users.invite',
            'users.manage_roles',

            // Reports/Dashboard
            'reports.view',
            'reports.export',
            'dashboard.view',
            'dashboard.team_metrics',
            'dashboard.company_metrics',

            // System
            'system.settings',
            'system.audit_logs',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'sanctum']
            );
        }

        // Create roles and assign permissions
        // Owner - Full access
        $ownerRole = Role::firstOrCreate(
            ['name' => 'owner', 'guard_name' => 'sanctum']
        );
        $ownerRole->syncPermissions(Permission::all());

        // Admin - Almost full access, no system settings
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'guard_name' => 'sanctum']
        );
        $adminRole->syncPermissions([
            // Tasks
            'tasks.view',
            'tasks.create',
            'tasks.update',
            'tasks.archive',
            'tasks.assign',

            // Documents
            'documents.view',
            'documents.upload',
            'documents.approve',
            'documents.reject',

            // Obligations
            'obligations.view',
            'obligations.create',
            'obligations.update',
            'obligations.generate_tasks',

            // Companies
            'companies.view',
            'companies.create',
            'companies.update',

            // Teams
            'teams.view',
            'teams.manage_members',

            // Users
            'users.view',
            'users.invite',

            // Reports
            'reports.view',
            'reports.export',
            'dashboard.view',
            'dashboard.team_metrics',
            'dashboard.company_metrics',
        ]);

        // Member - Basic access
        $memberRole = Role::firstOrCreate(
            ['name' => 'member', 'guard_name' => 'sanctum']
        );
        $memberRole->syncPermissions([
            // Tasks
            'tasks.view',
            'tasks.update',

            // Documents
            'documents.view',
            'documents.upload',

            // Obligations
            'obligations.view',

            // Companies
            'companies.view',

            // Teams
            'teams.view',

            // Users
            'users.view',

            // Reports
            'reports.view',
            'dashboard.view',
        ]);

        $this->command->info('Roles and permissions created successfully!');
        $this->command->info('Roles: owner, admin, member');
        $this->command->info('Permissions: ' . count($permissions) . ' total');
    }
}
