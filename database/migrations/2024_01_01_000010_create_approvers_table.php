<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approvers', function (Blueprint $table) {
            $table->id();
            $table->integer('sequence');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('document_type_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->index('document_type_id');
            $table->index('user_id');
            $table->unique(['document_type_id', 'sequence']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approvers');
    }
};
