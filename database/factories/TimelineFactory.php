<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Models\Timeline;
use App\Infrastructure\Persistence\Models\Task;
use App\Infrastructure\Persistence\Models\Document;
use App\Infrastructure\Persistence\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TimelineFactory extends Factory
{
    protected $model = Timeline::class;

    public function definition(): array
    {
        return [
            'task_id' => Task::factory(),
            'document_id' => null,
            'user_id' => User::factory(),
            'user_name' => fake()->name(),
            'type' => fake()->randomElement(['started', 'finished', 'send_file', 'free_text']),
            'description' => fake()->sentence(),
            'metadata' => null,
        ];
    }

    public function forTask(Task $task): static
    {
        return $this->state(fn(array $attributes) => [
            'task_id' => $task->id,
        ]);
    }

    public function forDocument(Document $document): static
    {
        return $this->state(fn(array $attributes) => [
            'document_id' => $document->id,
            'task_id' => $document->task_id,
        ]);
    }

    public function byUser(User $user): static
    {
        return $this->state(fn(array $attributes) => [
            'user_id' => $user->id,
            'user_name' => $user->name,
        ]);
    }

    public function comment(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => 'free_text',
            'description' => fake()->paragraph(),
        ]);
    }

    public function started(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => 'started',
            'description' => 'Documento iniciado',
        ]);
    }

    public function finished(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => 'finished',
            'description' => 'Documento finalizado',
        ]);
    }

    public function fileUploaded(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => 'send_file',
            'description' => 'Arquivo enviado',
        ]);
    }
}
