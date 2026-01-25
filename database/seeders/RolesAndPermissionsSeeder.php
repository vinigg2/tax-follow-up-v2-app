<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Roles and Permissions:
     *
     * MEMBER (visualizador):
     * - Pode apenas visualizar tudo
     * - Pode fazer upload de documentos (submeter para aprovacao)
     * - NAO pode executar nenhuma outra acao
     *
     * MANAGER (gestor):
     * - Pode fazer tudo EXCETO:
     *   - Cadastrar novos usuarios
     *   - Cadastrar novas empresas
     *
     * ADMIN (administrador):
     * - Pode fazer TUDO
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

        // ========================================
        // ADMIN - Full access (can do EVERYTHING)
        // ========================================
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'guard_name' => 'sanctum']
        );
        $adminRole->syncPermissions(Permission::all());

        // ========================================
        // MANAGER - Can do everything EXCEPT:
        // - Create/Update/Delete users
        // - Create/Update/Delete companies
        // ========================================
        $managerRole = Role::firstOrCreate(
            ['name' => 'manager', 'guard_name' => 'sanctum']
        );
        $managerRole->syncPermissions([
            // Tasks - FULL ACCESS
            'tasks.view',
            'tasks.create',
            'tasks.update',
            'tasks.delete',
            'tasks.archive',
            'tasks.assign',

            // Documents - FULL ACCESS
            'documents.view',
            'documents.upload',
            'documents.approve',
            'documents.reject',
            'documents.delete',

            // Obligations - FULL ACCESS
            'obligations.view',
            'obligations.create',
            'obligations.update',
            'obligations.delete',
            'obligations.generate_tasks',

            // Companies - VIEW ONLY (cannot create/update/delete)
            'companies.view',

            // Teams - PARTIAL (can view and manage members, cannot create/update/delete)
            'teams.view',
            'teams.manage_members',

            // Users - VIEW AND INVITE ONLY (cannot create/update/delete)
            'users.view',
            'users.invite',

            // Reports/Dashboard - FULL ACCESS
            'reports.view',
            'reports.export',
            'dashboard.view',
            'dashboard.team_metrics',
            'dashboard.company_metrics',
        ]);

        // ========================================
        // MEMBER - Can ONLY VIEW and UPLOAD documents
        // ========================================
        $memberRole = Role::firstOrCreate(
            ['name' => 'member', 'guard_name' => 'sanctum']
        );
        $memberRole->syncPermissions([
            // Tasks - VIEW ONLY
            'tasks.view',

            // Documents - VIEW and UPLOAD (to submit for approval)
            'documents.view',
            'documents.upload',

            // Obligations - VIEW ONLY
            'obligations.view',

            // Companies - VIEW ONLY
            'companies.view',

            // Teams - VIEW ONLY
            'teams.view',

            // Users - VIEW ONLY
            'users.view',

            // Reports/Dashboard - VIEW ONLY
            'reports.view',
            'dashboard.view',
        ]);

        // Remove the old 'owner' role if it exists (no longer needed)
        Role::where('name', 'owner')->where('guard_name', 'sanctum')->delete();

        $this->command->info('Roles and permissions updated successfully!');
        $this->command->info('Roles: admin, manager, member');
        $this->command->info('Permissions: ' . count($permissions) . ' total');
        $this->command->newLine();
        $this->command->info('ADMIN: Can do everything');
        $this->command->info('MANAGER: Can do everything except manage users and companies');
        $this->command->info('MEMBER: Can only view and upload documents');
    }
}
