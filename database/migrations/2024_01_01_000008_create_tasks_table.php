<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title', 30);
            $table->string('description', 250)->nullable();
            $table->boolean('is_active')->default(true);
            $table->date('deadline');
            $table->date('conclusion_date')->nullable();
            $table->string('status', 10)->default('new'); // new, pending, late, finished, rectified
            $table->foreignId('cause_id')->nullable()->constrained('obligations')->onDelete('set null');
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->foreignId('task_corrected')->nullable()->constrained('tasks')->onDelete('set null');
            $table->foreignId('responsible')->nullable()->constrained('users')->onDelete('set null');
            $table->unsignedInteger('cause_version')->nullable();
            $table->decimal('percent', 5, 2)->default(0);
            $table->string('competency', 10)->nullable();
            $table->integer('delayed_days')->default(0);
            $table->boolean('deleted')->default(false);
            $table->json('dynamic_fields')->nullable();
            $table->json('flowchart_fields')->nullable();
            $table->timestamps();

            $table->index('group_id');
            $table->index('company_id');
            $table->index('status');
            $table->index('deadline');
            $table->index('responsible');
            $table->index('deleted');
            $table->index('is_active');
            $table->index(['group_id', 'status', 'deleted']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
