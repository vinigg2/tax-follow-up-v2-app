<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 30);
            $table->string('description', 250)->nullable();
            $table->boolean('is_obligatory')->default(true);
            $table->foreignId('obligation_id')->constrained()->onDelete('cascade');
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->unsignedInteger('obligation_version')->nullable();
            $table->integer('estimated_days')->default(1);
            $table->boolean('required_file')->default(true);
            $table->string('approval_required', 20)->default('N'); // N, S, P
            $table->integer('order_items')->default(0);
            $table->timestamps();

            $table->index('obligation_id');
            $table->index('group_id');
            $table->index('is_obligatory');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_types');
    }
};
