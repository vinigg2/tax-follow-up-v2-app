<?php

namespace Database\Seeders;

use App\Infrastructure\Persistence\Models\User;
use App\Infrastructure\Persistence\Models\Group;
use App\Infrastructure\Persistence\Models\Company;
use App\Infrastructure\Persistence\Models\Obligation;
use App\Infrastructure\Persistence\Models\DocumentType;
use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\Document;
use App\Infrastructure\Persistence\Models\Approver;
use App\Infrastructure\Persistence\Models\ApproverSignature;
use App\Infrastructure\Persistence\Models\Timeline;
use App\Infrastructure\Persistence\Models\ObligationCompanyUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ==================== Roles & Permissions ====================
        $this->call(RolesAndPermissionsSeeder::class);

        // ==================== Users ====================
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@taxfollowup.com',
            'username' => 'admin',
            'password' => Hash::make('password'),
            'language' => 'pt',
            'confirmed_at' => now(),
        ]);

        $manager = User::create([
            'name' => 'Manager User',
            'email' => 'manager@taxfollowup.com',
            'username' => 'manager',
            'password' => Hash::make('password'),
            'language' => 'pt',
            'confirmed_at' => now(),
        ]);

        $user = User::create([
            'name' => 'Test User',
            'email' => 'user@taxfollowup.com',
            'username' => 'testuser',
            'password' => Hash::make('password'),
            'language' => 'pt',
            'confirmed_at' => now(),
        ]);

        // ==================== Assign Spatie Roles ====================
        // These are global roles for the Spatie permission system
        // The per-group role is defined in the user_groups pivot table
        $admin->assignRole('admin');
        $manager->assignRole('manager');
        $user->assignRole('member');

        // ==================== Group ====================
        $group = Group::create([
            'name' => 'Empresa Demo',
            'owner_id' => $admin->id,
        ]);

        // Add users to group with roles: admin, manager, member
        $group->users()->attach($admin->id, ['role' => 'admin']);
        $group->users()->attach($manager->id, ['role' => 'manager']);
        $group->users()->attach($user->id, ['role' => 'member']);

        // ==================== Companies ====================
        $companyA = Company::create([
            'name' => 'Empresa Alpha LTDA',
            'cnpj' => '12.345.678/0001-90',
            'country' => 'BR',
            'group_id' => $group->id,
        ]);

        $companyB = Company::create([
            'name' => 'Empresa Beta S/A',
            'cnpj' => '98.765.432/0001-10',
            'country' => 'BR',
            'group_id' => $group->id,
        ]);

        $companyC = Company::create([
            'name' => 'Empresa Gamma ME',
            'cnpj' => '11.222.333/0001-44',
            'country' => 'BR',
            'group_id' => $group->id,
        ]);

        // ==================== Obligations ====================
        $obligationDCTF = Obligation::create([
            'title' => 'DCTF Mensal',
            'description' => 'Declaracao mensal de debitos e creditos tributarios federais',
            'frequency' => 'MM',
            'day_deadline' => 15,
            'month_deadline' => null,
            'group_id' => $group->id,
            'kind' => 'federal',
            'initial_generation_date' => '2024-01-01',
            'period' => 1,
            'generate_automatic_tasks' => true,
            'show_dashboard' => true,
        ]);

        $obligationEFD = Obligation::create([
            'title' => 'EFD ICMS/IPI',
            'description' => 'Escrituracao Fiscal Digital do ICMS e IPI',
            'frequency' => 'MM',
            'day_deadline' => 20,
            'month_deadline' => null,
            'group_id' => $group->id,
            'kind' => 'estadual',
            'initial_generation_date' => '2024-01-01',
            'period' => 1,
            'generate_automatic_tasks' => true,
            'show_dashboard' => true,
        ]);

        $obligationDIRF = Obligation::create([
            'title' => 'DIRF Anual',
            'description' => 'Declaracao anual de imposto retido na fonte',
            'frequency' => 'AA',
            'day_deadline' => 28,
            'month_deadline' => 2,
            'group_id' => $group->id,
            'kind' => 'federal',
            'initial_generation_date' => '2023-01-01',
            'period' => 1,
            'generate_automatic_tasks' => true,
            'show_dashboard' => true,
        ]);

        // ==================== Document Types (linked to obligations) ====================
        // DCTF document types
        $docTypeDCTFDeclaracao = DocumentType::create([
            'name' => 'Declaracao DCTF',
            'description' => 'Arquivo da declaracao DCTF',
            'obligation_id' => $obligationDCTF->id,
            'group_id' => $group->id,
            'is_obligatory' => true,
            'estimated_days' => 5,
            'required_file' => true,
            'approval_required' => 'S',
            'order_items' => 1,
        ]);

        $docTypeDCTFComprovante = DocumentType::create([
            'name' => 'Comprovante de Envio',
            'description' => 'Comprovante de envio da declaracao DCTF',
            'obligation_id' => $obligationDCTF->id,
            'group_id' => $group->id,
            'is_obligatory' => true,
            'estimated_days' => 1,
            'required_file' => true,
            'approval_required' => 'N',
            'order_items' => 2,
        ]);

        // EFD document types
        $docTypeEFDArquivo = DocumentType::create([
            'name' => 'Arquivo EFD',
            'description' => 'Arquivo digital da EFD',
            'obligation_id' => $obligationEFD->id,
            'group_id' => $group->id,
            'is_obligatory' => true,
            'estimated_days' => 3,
            'required_file' => true,
            'approval_required' => 'S',
            'order_items' => 1,
        ]);

        $docTypeEFDProtocolo = DocumentType::create([
            'name' => 'Protocolo EFD',
            'description' => 'Protocolo de transmissao da EFD',
            'obligation_id' => $obligationEFD->id,
            'group_id' => $group->id,
            'is_obligatory' => true,
            'estimated_days' => 1,
            'required_file' => true,
            'approval_required' => 'S',
            'order_items' => 2,
        ]);

        // DIRF document types
        $docTypeDIRF = DocumentType::create([
            'name' => 'Declaracao DIRF',
            'description' => 'Arquivo da declaracao DIRF',
            'obligation_id' => $obligationDIRF->id,
            'group_id' => $group->id,
            'is_obligatory' => true,
            'estimated_days' => 10,
            'required_file' => true,
            'approval_required' => 'S',
            'order_items' => 1,
        ]);

        // ==================== Approvers ====================
        $approverAdmin = Approver::create([
            'user_id' => $admin->id,
            'document_type_id' => $docTypeDCTFDeclaracao->id,
            'sequence' => 1,
        ]);

        $approverManager = Approver::create([
            'user_id' => $manager->id,
            'document_type_id' => $docTypeDCTFDeclaracao->id,
            'sequence' => 2,
        ]);

        Approver::create([
            'user_id' => $manager->id,
            'document_type_id' => $docTypeEFDArquivo->id,
            'sequence' => 1,
        ]);

        // ==================== Obligation-Company-User Mapping ====================
        ObligationCompanyUser::create([
            'obligation_id' => $obligationDCTF->id,
            'company_id' => $companyA->id,
            'user_id' => $user->id,
        ]);

        ObligationCompanyUser::create([
            'obligation_id' => $obligationDCTF->id,
            'company_id' => $companyB->id,
            'user_id' => $user->id,
        ]);

        ObligationCompanyUser::create([
            'obligation_id' => $obligationEFD->id,
            'company_id' => $companyA->id,
            'user_id' => $manager->id,
        ]);

        // ==================== Tasks ====================
        // Task 1: New task (future deadline)
        $task1 = Task::create([
            'title' => 'DCTF 12/2024',
            'description' => 'Entregar DCTF referente a dezembro/2024',
            'deadline' => now()->addDays(10),
            'status' => 'new',
            'company_id' => $companyA->id,
            'group_id' => $group->id,
            'responsible' => $user->id,
            'cause_id' => $obligationDCTF->id,
            'cause_version' => 1,
            'competency' => '2024-12-01',
            'is_active' => true,
        ]);

        // Task 2: Pending task (deadline in 5 days)
        $task2 = Task::create([
            'title' => 'EFD 11/2024',
            'description' => 'Entregar EFD ICMS/IPI referente a novembro/2024',
            'deadline' => now()->addDays(5),
            'status' => 'pending',
            'company_id' => $companyA->id,
            'group_id' => $group->id,
            'responsible' => $manager->id,
            'cause_id' => $obligationEFD->id,
            'cause_version' => 1,
            'competency' => '2024-11-01',
            'is_active' => true,
            'percent' => 50,
        ]);

        // Task 3: Late task (deadline passed)
        $task3 = Task::create([
            'title' => 'DCTF 11/2024',
            'description' => 'Entregar DCTF referente a novembro/2024',
            'deadline' => now()->subDays(3),
            'status' => 'late',
            'company_id' => $companyB->id,
            'group_id' => $group->id,
            'responsible' => $user->id,
            'cause_id' => $obligationDCTF->id,
            'cause_version' => 1,
            'competency' => '2024-11-01',
            'is_active' => true,
            'delayed_days' => 3,
        ]);

        // Task 4: Finished task
        $task4 = Task::create([
            'title' => 'DCTF 10/2024',
            'description' => 'Entregar DCTF referente a outubro/2024',
            'deadline' => now()->subDays(30),
            'status' => 'finished',
            'company_id' => $companyA->id,
            'group_id' => $group->id,
            'responsible' => $user->id,
            'cause_id' => $obligationDCTF->id,
            'cause_version' => 1,
            'competency' => '2024-10-01',
            'is_active' => true,
            'percent' => 100,
            'conclusion_date' => now()->subDays(32),
        ]);

        // Task 5: Archived task
        $task5 = Task::create([
            'title' => 'DIRF 2023',
            'description' => 'Declaracao de IR retido na fonte de 2023',
            'deadline' => now()->subMonths(10),
            'status' => 'finished',
            'company_id' => $companyA->id,
            'group_id' => $group->id,
            'responsible' => $admin->id,
            'cause_id' => $obligationDIRF->id,
            'cause_version' => 1,
            'competency' => '2023-01-01',
            'is_active' => false,
            'percent' => 100,
            'conclusion_date' => now()->subMonths(10)->subDays(5),
        ]);

        // Task 6: Task for Company B
        $task6 = Task::create([
            'title' => 'EFD 12/2024',
            'description' => 'Entregar EFD ICMS/IPI referente a dezembro/2024',
            'deadline' => now()->addDays(15),
            'status' => 'new',
            'company_id' => $companyB->id,
            'group_id' => $group->id,
            'responsible' => $manager->id,
            'cause_id' => $obligationEFD->id,
            'cause_version' => 1,
            'competency' => '2024-12-01',
            'is_active' => true,
        ]);

        // Task 7: Task for Company C
        $task7 = Task::create([
            'title' => 'DCTF 12/2024',
            'description' => 'Entregar DCTF referente a dezembro/2024',
            'deadline' => now()->addDays(8),
            'status' => 'pending',
            'company_id' => $companyC->id,
            'group_id' => $group->id,
            'responsible' => $user->id,
            'cause_id' => $obligationDCTF->id,
            'cause_version' => 1,
            'competency' => '2024-12-01',
            'is_active' => true,
        ]);

        // ==================== Documents ====================
        // Documents for Task 1 (new task - DCTF)
        $doc1 = Document::create([
            'name' => 'Declaracao DCTF',
            'description' => 'Arquivo da declaracao DCTF',
            'document_type_id' => $docTypeDCTFDeclaracao->id,
            'task_id' => $task1->id,
            'company_id' => $companyA->id,
            'group_id' => $group->id,
            'status' => 'unstarted',
            'is_obligatory' => true,
            'estimated_days' => 5,
            'required_file' => true,
            'approval_required' => 'S',
            'order_items' => 1,
        ]);

        $doc2 = Document::create([
            'name' => 'Comprovante de Envio',
            'description' => 'Comprovante de envio da declaracao',
            'document_type_id' => $docTypeDCTFComprovante->id,
            'task_id' => $task1->id,
            'company_id' => $companyA->id,
            'group_id' => $group->id,
            'status' => 'unstarted',
            'is_obligatory' => true,
            'estimated_days' => 1,
            'required_file' => true,
            'approval_required' => 'N',
            'order_items' => 2,
        ]);

        // Documents for Task 2 (pending task - EFD, partially done)
        $doc3 = Document::create([
            'name' => 'Arquivo EFD',
            'description' => 'Arquivo digital da EFD',
            'document_type_id' => $docTypeEFDArquivo->id,
            'task_id' => $task2->id,
            'company_id' => $companyA->id,
            'group_id' => $group->id,
            'status' => 'finished',
            'is_obligatory' => true,
            'estimated_days' => 3,
            'required_file' => true,
            'approval_required' => 'S',
            'order_items' => 1,
            'document_path' => 'documents/efd_112024.txt',
            'submission_date' => now()->subDays(2),
            'finish_date' => now()->subDays(1),
        ]);

        $doc4 = Document::create([
            'name' => 'Protocolo de Transmissao',
            'description' => 'Protocolo de transmissao da EFD',
            'document_type_id' => $docTypeEFDProtocolo->id,
            'task_id' => $task2->id,
            'company_id' => $companyA->id,
            'group_id' => $group->id,
            'status' => 'on_approval',
            'is_obligatory' => true,
            'estimated_days' => 1,
            'required_file' => true,
            'approval_required' => 'S',
            'order_items' => 2,
            'document_path' => 'documents/protocolo_efd.pdf',
            'submission_date' => now()->subDays(1),
        ]);

        // Documents for Task 3 (late task - DCTF)
        $doc5 = Document::create([
            'name' => 'Declaracao DCTF',
            'description' => 'Arquivo da declaracao DCTF',
            'document_type_id' => $docTypeDCTFDeclaracao->id,
            'task_id' => $task3->id,
            'company_id' => $companyB->id,
            'group_id' => $group->id,
            'status' => 'started',
            'is_obligatory' => true,
            'estimated_days' => 5,
            'required_file' => true,
            'approval_required' => 'S',
            'order_items' => 1,
        ]);

        // Documents for Task 4 (finished task - DCTF)
        $doc6 = Document::create([
            'name' => 'Declaracao DCTF',
            'description' => 'Arquivo da declaracao DCTF',
            'document_type_id' => $docTypeDCTFDeclaracao->id,
            'task_id' => $task4->id,
            'company_id' => $companyA->id,
            'group_id' => $group->id,
            'status' => 'finished',
            'is_obligatory' => true,
            'estimated_days' => 5,
            'required_file' => true,
            'approval_required' => 'S',
            'order_items' => 1,
            'document_path' => 'documents/dctf_102024.txt',
            'submission_date' => now()->subDays(35),
            'finish_date' => now()->subDays(32),
        ]);

        // ==================== Approver Signatures ====================
        // Pending approval for doc4
        ApproverSignature::create([
            'document_id' => $doc4->id,
            'user_id' => $manager->id,
            'status' => 'pending',
            'sequence' => 1,
        ]);

        // Completed approval for doc6
        ApproverSignature::create([
            'document_id' => $doc6->id,
            'user_id' => $admin->id,
            'status' => 'signed',
            'sequence' => 1,
            'signed_at' => now()->subDays(33),
            'comment' => 'Aprovado conforme verificacao',
        ]);

        // ==================== Timeline Entries ====================
        Timeline::createEntry('started', $task2->id, $manager->id, 'Tarefa iniciada');
        Timeline::createEntry('send_file', $task2->id, $manager->id, 'Arquivo EFD enviado');
        Timeline::createEntry('finished', $task2->id, $manager->id, 'Documento EFD finalizado');
        Timeline::createEntry('request_approval', $task2->id, $manager->id, 'Solicitada aprovacao do protocolo');

        Timeline::createEntry('started', $task3->id, $user->id, 'Tarefa iniciada');

        Timeline::createEntry('started', $task4->id, $user->id, 'Tarefa iniciada');
        Timeline::createEntry('send_file', $task4->id, $user->id, 'Arquivo DCTF enviado');
        Timeline::createEntry('request_approval', $task4->id, $user->id, 'Solicitada aprovacao');
        Timeline::createEntry('approved', $task4->id, $admin->id, 'Documento aprovado');
        Timeline::createEntry('finished', $task4->id, $user->id, 'Tarefa finalizada');

        Timeline::createEntry('started', $task5->id, $admin->id, 'Tarefa iniciada');
        Timeline::createEntry('finished', $task5->id, $admin->id, 'Tarefa finalizada');
        Timeline::createEntry('archived_task', $task5->id, $admin->id, 'Tarefa arquivada');

        echo "Database seeded successfully!\n";
        echo "Users:\n";
        echo "  - admin@taxfollowup.com / password (Admin - Group Owner)\n";
        echo "  - manager@taxfollowup.com / password (Manager)\n";
        echo "  - user@taxfollowup.com / password (Member)\n";
        echo "Tasks created: 7 (various statuses)\n";
        echo "Companies: 3\n";
        echo "Obligations: 3\n";
    }
}
