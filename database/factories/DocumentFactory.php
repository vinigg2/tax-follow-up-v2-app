<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Models\Document;
use App\Infrastructure\Persistence\Models\DocumentType;
use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\Company;
use App\Infrastructure\Persistence\Models\Group;
use App\Infrastructure\Persistence\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentFactory extends Factory
{
    protected $model = Document::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'description' => fake()->sentence(),
            'submission_date' => null,
            'document_path' => null,
            'document_type_id' => DocumentType::factory(),
            'sender_id' => null,
            'task_id' => Task::factory(),
            'company_id' => Company::factory(),
            'group_id' => Group::factory(),
            'status' => 'unstarted',
            'start_date' => null,
            'finish_date' => null,
            'is_obligatory' => true,
            'estimated_days' => fake()->numberBetween(1, 10),
            'required_file' => true,
            'approval_required' => 'N',
            'file_size_bytes' => null,
            'order_items' => 1,
        ];
    }

    public function forTask(Task $task): static
    {
        return $this->state(fn(array $attributes) => [
            'task_id' => $task->id,
            'company_id' => $task->company_id,
            'group_id' => $task->group_id,
        ]);
    }

    public function forGroup(Group $group): static
    {
        return $this->state(fn(array $attributes) => [
            'group_id' => $group->id,
        ]);
    }

    public function optional(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_obligatory' => false,
        ]);
    }

    public function unstarted(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'unstarted',
        ]);
    }

    public function started(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'started',
            'start_date' => now(),
        ]);
    }

    public function onApproval(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'on_approval',
            'start_date' => fake()->dateTimeBetween('-10 days', '-1 day'),
            'document_path' => 'documents/' . fake()->uuid() . '.pdf',
        ]);
    }

    public function finished(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'finished',
            'start_date' => fake()->dateTimeBetween('-10 days', '-5 days'),
            'finish_date' => now(),
            'document_path' => 'documents/' . fake()->uuid() . '.pdf',
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'rejected',
            'start_date' => fake()->dateTimeBetween('-10 days', '-1 day'),
        ]);
    }

    public function withFile(): static
    {
        return $this->state(fn(array $attributes) => [
            'document_path' => 'documents/' . fake()->uuid() . '.pdf',
            'file_size_bytes' => fake()->numberBetween(1024, 10485760),
            'submission_date' => now(),
            'sender_id' => User::factory(),
        ]);
    }

    public function sequentialApproval(): static
    {
        return $this->state(fn(array $attributes) => [
            'approval_required' => 'S',
        ]);
    }

    public function parallelApproval(): static
    {
        return $this->state(fn(array $attributes) => [
            'approval_required' => 'P',
        ]);
    }
}
