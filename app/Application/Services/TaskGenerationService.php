<?php

namespace App\Application\Services;

use App\Infrastructure\Persistence\Models\Obligation;
use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\Document;
use App\Infrastructure\Persistence\Models\Company;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class TaskGenerationService
{
    /**
     * Generate tasks for an obligation based on competencies
     */
    public function generateTasks(
        Obligation $obligation,
        array $companyIds,
        array $competencies,
        ?int $responsibleUserId = null
    ): Collection {
        $tasks = collect();

        foreach ($companyIds as $companyId) {
            $company = Company::find($companyId);
            if (!$company || $company->group_id !== $obligation->group_id) {
                continue;
            }

            // Get responsible user
            $responsible = $responsibleUserId ?? $obligation->getResponsibleForCompany($company)?->id;

            foreach ($competencies as $competency) {
                // Check if task already exists
                $existingTask = Task::where('cause_id', $obligation->id)
                    ->where('company_id', $companyId)
                    ->where('competency', $competency)
                    ->where('deleted', false)
                    ->first();

                if ($existingTask) {
                    continue;
                }

                // Calculate deadline
                $deadline = $this->calculateDeadline($obligation, $competency);

                // Create task
                $task = Task::create([
                    'title' => $this->generateTitle($obligation, $competency),
                    'description' => $obligation->description,
                    'deadline' => $deadline,
                    'status' => $this->calculateInitialStatus($deadline),
                    'cause_id' => $obligation->id,
                    'cause_version' => $obligation->version,
                    'company_id' => $companyId,
                    'group_id' => $obligation->group_id,
                    'responsible' => $responsible,
                    'competency' => $competency,
                    'is_active' => true,
                    'dynamic_fields' => $obligation->dynamic_fields,
                    'flowchart_fields' => $obligation->flowchart_fields,
                ]);

                // Create documents based on document types
                $this->createDocumentsForTask($task, $obligation);

                $tasks->push($task);
            }
        }

        // Update last competence on obligation
        if ($tasks->isNotEmpty()) {
            $lastCompetency = collect($competencies)->sort()->last();
            $obligation->update(['last_competence' => $lastCompetency]);
        }

        return $tasks;
    }

    /**
     * Preview tasks that would be generated (without actually creating them)
     */
    public function previewTasks(
        Obligation $obligation,
        array $companyIds,
        array $competencies
    ): Collection {
        $preview = collect();

        foreach ($companyIds as $companyId) {
            $company = Company::find($companyId);
            if (!$company || $company->group_id !== $obligation->group_id) {
                continue;
            }

            foreach ($competencies as $competency) {
                // Check if task already exists
                $existingTask = Task::where('cause_id', $obligation->id)
                    ->where('company_id', $companyId)
                    ->where('competency', $competency)
                    ->where('deleted', false)
                    ->first();

                $deadline = $this->calculateDeadline($obligation, $competency);

                $preview->push([
                    'company_id' => $companyId,
                    'company_name' => $company->name,
                    'competency' => $competency,
                    'title' => $this->generateTitle($obligation, $competency),
                    'deadline' => $deadline->format('Y-m-d'),
                    'already_exists' => (bool) $existingTask,
                    'existing_task_id' => $existingTask?->id,
                ]);
            }
        }

        return $preview;
    }

    /**
     * Generate competencies for a period
     */
    public function generateCompetencies(
        Obligation $obligation,
        Carbon $startDate,
        Carbon $endDate
    ): array {
        $competencies = [];
        $current = $startDate->copy()->startOfMonth();

        while ($current->lte($endDate)) {
            if ($obligation->isMonthly()) {
                $competencies[] = $current->format('Y-m-01');
                $current->addMonth();
            } elseif ($obligation->isQuarterly()) {
                // Only quarters: Jan, Apr, Jul, Oct
                if (in_array($current->month, [1, 4, 7, 10])) {
                    $competencies[] = $current->format('Y-m-01');
                }
                $current->addMonth();
            } elseif ($obligation->isAnnual()) {
                $competencies[] = $current->format('Y-01-01');
                $current->addYear();
            }
        }

        return $competencies;
    }

    /**
     * Run automatic task generation for all eligible obligations
     */
    public function runAutomaticGeneration(): array
    {
        $results = [
            'processed' => 0,
            'tasks_created' => 0,
            'errors' => [],
        ];

        $obligations = Obligation::where('deleted', false)
            ->where('generate_automatic_tasks', true)
            ->get();

        foreach ($obligations as $obligation) {
            try {
                $tasks = $this->generateAutomaticTasksForObligation($obligation);
                $results['tasks_created'] += $tasks->count();
                $results['processed']++;
            } catch (\Exception $e) {
                $results['errors'][] = [
                    'obligation_id' => $obligation->id,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $results;
    }

    // ==================== Private Methods ====================

    private function calculateDeadline(Obligation $obligation, string $competency): Carbon
    {
        $competencyDate = Carbon::parse($competency);

        // Calculate deadline based on obligation configuration
        $deadline = $competencyDate->copy();

        if ($obligation->isMonthly()) {
            // Deadline is next month + day_deadline
            $deadline->addMonth()
                ->setDay(min($obligation->day_deadline, $deadline->daysInMonth));
        } elseif ($obligation->isQuarterly()) {
            // Deadline is 1 month after quarter end + day_deadline
            $deadline->addMonths(3)
                ->setDay(min($obligation->day_deadline, $deadline->daysInMonth));
        } elseif ($obligation->isAnnual()) {
            // Deadline is month_deadline (next year) + day_deadline
            $deadline->addYear();
            if ($obligation->month_deadline) {
                $deadline->setMonth($obligation->month_deadline);
            }
            $deadline->setDay(min($obligation->day_deadline, $deadline->daysInMonth));
        }

        return $deadline;
    }

    private function generateTitle(Obligation $obligation, string $competency): string
    {
        $competencyDate = Carbon::parse($competency);

        $title = $obligation->title;

        // Add competency to title (max 30 chars)
        if ($obligation->isMonthly()) {
            $suffix = ' ' . $competencyDate->format('m/Y');
        } elseif ($obligation->isQuarterly()) {
            $quarter = ceil($competencyDate->month / 3);
            $suffix = " Q{$quarter}/{$competencyDate->year}";
        } else {
            $suffix = ' ' . $competencyDate->format('Y');
        }

        // Truncate title if needed
        $maxTitleLength = 30 - strlen($suffix);
        if (strlen($title) > $maxTitleLength) {
            $title = substr($title, 0, $maxTitleLength);
        }

        return $title . $suffix;
    }

    private function calculateInitialStatus(Carbon $deadline): string
    {
        $daysUntilDeadline = now()->diffInDays($deadline, false);

        if ($daysUntilDeadline < 0) {
            return 'late';
        } elseif ($daysUntilDeadline <= config('taxfollowup.time_to_pending_days', 7)) {
            return 'pending';
        }

        return 'new';
    }

    private function createDocumentsForTask(Task $task, Obligation $obligation): void
    {
        $documentTypes = $obligation->activeDocumentTypes()->get();

        foreach ($documentTypes as $docType) {
            Document::create([
                'name' => $docType->name,
                'description' => $docType->description,
                'document_type_id' => $docType->id,
                'task_id' => $task->id,
                'company_id' => $task->company_id,
                'group_id' => $task->group_id,
                'status' => 'unstarted',
                'is_obligatory' => $docType->is_obligatory,
                'estimated_days' => $docType->estimated_days,
                'required_file' => $docType->required_file,
                'approval_required' => $docType->approval_required,
                'order_items' => $docType->order_items,
            ]);
        }
    }

    private function generateAutomaticTasksForObligation(Obligation $obligation): Collection
    {
        // Get all companies assigned to this obligation
        $companyIds = $obligation->obligationCompanyUsers()
            ->pluck('company_id')
            ->unique()
            ->toArray();

        if (empty($companyIds)) {
            return collect();
        }

        // Calculate competencies to generate
        $startDate = $obligation->last_competence
            ? Carbon::parse($obligation->last_competence)->addMonth()
            : Carbon::parse($obligation->initial_generation_date);

        $endDate = $obligation->final_generation_date
            ? Carbon::parse($obligation->final_generation_date)
            : now()->addMonths($obligation->months_advanced ?: 1);

        $competencies = $this->generateCompetencies($obligation, $startDate, $endDate);

        return $this->generateTasks($obligation, $companyIds, $competencies);
    }
}
