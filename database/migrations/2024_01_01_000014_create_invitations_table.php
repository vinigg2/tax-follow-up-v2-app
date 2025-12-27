<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->string('code', 200)->unique();
            $table->boolean('is_valid')->default(true);
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->boolean('is_admin_invitation')->default(false);
            $table->foreignId('group_id')->constrained()->onDelete('restrict');
            $table->foreignId('user_allowed_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('guest_email', 50)->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->index('code');
            $table->index('group_id');
            $table->index('guest_email');
            $table->index('is_valid');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};
