<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email', 50)->unique();
            $table->string('name', 50);
            $table->string('username', 50)->unique();
            $table->string('avatar', 250)->nullable();
            $table->string('password', 60);
            $table->string('new_email', 50)->nullable();
            $table->string('reset_code', 255)->nullable();
            $table->timestamp('reset_code_expiration')->nullable();
            $table->string('confirmation_token', 10)->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('last_change_password')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('language', 5)->default('en');
            $table->boolean('monthly_notifications')->default(true);
            $table->boolean('weekly_notifications')->default(true);
            $table->boolean('daily_notifications')->default(true);
            $table->json('favorite_task_filter')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->index('email');
            $table->index('username');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
