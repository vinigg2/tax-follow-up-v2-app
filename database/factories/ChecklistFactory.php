<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Models\Checklist;
use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChecklistFactory extends Factory
{
    protected $model = Checklist::class;

    public function definition(): array
    {
        return [
            'task_id' => Task::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->sentence(),
            'status' => Checklist::STATUS_PENDENTE,
            'order' => fake()->numberBetween(1, 10),
            'assigned_to' => null,
            'completed_at' => null,
            'completed_by' => null,
        ];
    }

    public function forTask(Task $task): static
    {
        return $this->state(fn(array $attributes) => [
            'task_id' => $task->id,
        ]);
    }

    public function assignedTo(User $user): static
    {
        return $this->state(fn(array $attributes) => [
            'assigned_to' => $user->id,
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => Checklist::STATUS_PENDENTE,
            'completed_at' => null,
            'completed_by' => null,
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => Checklist::STATUS_EM_ANDAMENTO,
            'completed_at' => null,
            'completed_by' => null,
        ]);
    }

    public function completed(?User $completedBy = null): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => Checklist::STATUS_CONCLUIDO,
            'completed_at' => now(),
            'completed_by' => $completedBy?->id ?? User::factory(),
        ]);
    }

    public function withOrder(int $order): static
    {
        return $this->state(fn(array $attributes) => [
            'order' => $order,
        ]);
    }
}
