<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\Company;
use App\Infrastructure\Persistence\Models\Group;
use App\Infrastructure\Persistence\Models\Obligation;
use App\Infrastructure\Persistence\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'title' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'is_active' => true,
            'deadline' => fake()->dateTimeBetween('now', '+30 days'),
            'conclusion_date' => null,
            'status' => fake()->randomElement(['pending', 'in_progress', 'on_approval', 'finished']),
            'cause_id' => Obligation::factory(),
            'company_id' => Company::factory(),
            'group_id' => Group::factory(),
            'task_corrected' => null,
            'responsible' => User::factory(),
            'cause_version' => 1,
            'percent' => 0,
            'competency' => now()->format('Y-m'),
            'delayed_days' => 0,
            'deleted' => false,
            'dynamic_fields' => [],
            'flowchart_fields' => [],
        ];
    }

    public function forGroup(Group $group): static
    {
        return $this->state(fn(array $attributes) => [
            'group_id' => $group->id,
        ]);
    }

    public function forCompany(Company $company): static
    {
        return $this->state(fn(array $attributes) => [
            'company_id' => $company->id,
        ]);
    }

    public function forObligation(Obligation $obligation): static
    {
        return $this->state(fn(array $attributes) => [
            'cause_id' => $obligation->id,
            'cause_version' => $obligation->version,
        ]);
    }

    public function assignedTo(User $user): static
    {
        return $this->state(fn(array $attributes) => [
            'responsible' => $user->id,
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'pending',
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'in_progress',
        ]);
    }

    public function onApproval(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'on_approval',
        ]);
    }

    public function finished(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'finished',
            'conclusion_date' => now(),
            'percent' => 100,
        ]);
    }

    public function late(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'late',
            'deadline' => fake()->dateTimeBetween('-30 days', '-1 day'),
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function deleted(): static
    {
        return $this->state(fn(array $attributes) => [
            'deleted' => true,
        ]);
    }

    public function correction(Task $originalTask): static
    {
        return $this->state(fn(array $attributes) => [
            'task_corrected' => $originalTask->id,
            'title' => $originalTask->title,
            'cause_id' => $originalTask->cause_id,
            'company_id' => $originalTask->company_id,
            'group_id' => $originalTask->group_id,
        ]);
    }
}
