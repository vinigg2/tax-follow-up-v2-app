<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Models\Obligation;
use App\Infrastructure\Persistence\Models\Group;
use Illuminate\Database\Eloquent\Factories\Factory;

class ObligationFactory extends Factory
{
    protected $model = Obligation::class;

    public function definition(): array
    {
        return [
            'title' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'frequency' => fake()->randomElement(['MM', 'QT', 'AA']),
            'day_deadline' => fake()->numberBetween(1, 28),
            'month_deadline' => fake()->numberBetween(1, 12),
            'kind' => fake()->randomElement(['fiscal', 'contabil', 'trabalhista']),
            'group_id' => Group::factory(),
            'initial_generation_date' => now()->startOfYear(),
            'final_generation_date' => now()->endOfYear(),
            'generate_automatic_tasks' => true,
            'show_dashboard' => true,
            'version' => 1,
            'deleted' => false,
        ];
    }

    public function forGroup(Group $group): static
    {
        return $this->state(fn(array $attributes) => [
            'group_id' => $group->id,
        ]);
    }

    public function monthly(): static
    {
        return $this->state(fn(array $attributes) => [
            'frequency' => 'MM',
        ]);
    }

    public function quarterly(): static
    {
        return $this->state(fn(array $attributes) => [
            'frequency' => 'QT',
        ]);
    }

    public function yearly(): static
    {
        return $this->state(fn(array $attributes) => [
            'frequency' => 'AA',
        ]);
    }
}
