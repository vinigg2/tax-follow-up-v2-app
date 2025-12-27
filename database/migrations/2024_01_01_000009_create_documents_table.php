<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->date('submission_date')->nullable();
            $table->string('document_path', 200)->nullable();
            $table->foreignId('document_type_id')->constrained()->onDelete('cascade');
            $table->foreignId('sender_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->string('status', 20)->default('unstarted');
            $table->date('start_date')->nullable();
            $table->date('finish_date')->nullable();
            $table->string('name', 30);
            $table->string('description', 250)->nullable();
            $table->boolean('is_obligatory')->default(true);
            $table->integer('estimated_days')->default(1);
            $table->boolean('required_file')->default(true);
            $table->string('approval_required', 20)->default('N');
            $table->bigInteger('file_size_bytes')->nullable();
            $table->integer('order_items')->default(0);
            $table->timestamps();

            $table->index('task_id');
            $table->index('group_id');
            $table->index('status');
            $table->index('document_type_id');
            $table->index(['task_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
