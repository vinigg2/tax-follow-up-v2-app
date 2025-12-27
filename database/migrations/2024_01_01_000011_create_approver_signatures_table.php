<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approver_signatures', function (Blueprint $table) {
            $table->id();
            $table->integer('sequence');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('document_id')->constrained()->onDelete('cascade');
            $table->string('status', 20)->nullable(); // null, pending, signed, rejected
            $table->text('comment')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();

            $table->index('document_id');
            $table->index('user_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approver_signatures');
    }
};
