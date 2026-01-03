<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Models\Company;
use App\Infrastructure\Persistence\Models\Group;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'cnpj' => fake()->numerify('##.###.###/####-##'),
            'country' => 'BR',
            'group_id' => Group::factory(),
            'deleted' => false,
        ];
    }

    public function forGroup(Group $group): static
    {
        return $this->state(fn(array $attributes) => [
            'group_id' => $group->id,
        ]);
    }
}
