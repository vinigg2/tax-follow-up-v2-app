<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Models\DocumentType;
use App\Infrastructure\Persistence\Models\Obligation;
use App\Infrastructure\Persistence\Models\Group;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentTypeFactory extends Factory
{
    protected $model = DocumentType::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'description' => fake()->sentence(),
            'is_obligatory' => true,
            'obligation_id' => Obligation::factory(),
            'group_id' => Group::factory(),
            'obligation_version' => 1,
            'estimated_days' => fake()->numberBetween(1, 10),
            'required_file' => true,
            'approval_required' => fake()->randomElement(['N', 'S', 'P']),
            'order_items' => 1,
        ];
    }

    public function forObligation(Obligation $obligation): static
    {
        return $this->state(fn(array $attributes) => [
            'obligation_id' => $obligation->id,
            'obligation_version' => $obligation->version,
            'group_id' => $obligation->group_id,
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

    public function noApproval(): static
    {
        return $this->state(fn(array $attributes) => [
            'approval_required' => 'N',
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

    public function noFileRequired(): static
    {
        return $this->state(fn(array $attributes) => [
            'required_file' => false,
        ]);
    }
}
