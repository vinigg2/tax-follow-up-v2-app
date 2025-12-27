<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('obligations', function (Blueprint $table) {
            $table->id();
            $table->string('title', 30);
            $table->string('description', 250)->nullable();
            $table->string('frequency', 2); // MM, QT, AA
            $table->tinyInteger('day_deadline');
            $table->tinyInteger('month_deadline')->nullable();
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->unsignedInteger('version')->default(0);
            $table->date('initial_generation_date');
            $table->date('final_generation_date')->nullable();
            $table->integer('period')->default(1);
            $table->string('kind', 30);
            $table->string('last_competence', 10)->nullable();
            $table->string('last_year_month_qt', 10)->nullable();
            $table->integer('months_advanced')->default(0);
            $table->boolean('generate_automatic_tasks')->default(false);
            $table->boolean('show_dashboard')->default(false);
            $table->boolean('deleted')->default(false);
            $table->json('dynamic_fields')->nullable();
            $table->json('flowchart_fields')->nullable();
            $table->timestamps();

            $table->index('group_id');
            $table->index('frequency');
            $table->index('deleted');
            $table->index('generate_automatic_tasks');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('obligations');
    }
};
