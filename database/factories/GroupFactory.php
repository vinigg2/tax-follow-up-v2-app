<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Models\Group;
use App\Infrastructure\Persistence\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class GroupFactory extends Factory
{
    protected $model = Group::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'owner_id' => User::factory(),
            'deleted' => false,
        ];
    }

    public function deleted(): static
    {
        return $this->state(fn(array $attributes) => [
            'deleted' => true,
        ]);
    }
}
