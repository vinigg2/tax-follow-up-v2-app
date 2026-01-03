<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'username' => fake()->unique()->userName(),
            'password' => Hash::make('password'),
            'phone' => fake()->phoneNumber(),
            'language' => 'pt-BR',
            'is_active' => true,
            'mfa_enabled' => false,
            'daily_notifications' => true,
            'weekly_notifications' => true,
            'monthly_notifications' => true,
            'confirmed_at' => now(),
            'remember_token' => Str::random(10),
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function withMfa(string $method = 'totp'): static
    {
        return $this->state(fn(array $attributes) => [
            'mfa_enabled' => true,
            'mfa_method' => $method,
            'mfa_secret' => 'TESTSECRET123456',
            'mfa_verified_at' => now(),
        ]);
    }

    public function unconfirmed(): static
    {
        return $this->state(fn(array $attributes) => [
            'confirmed_at' => null,
            'confirmation_token' => Str::random(32),
        ]);
    }
}
