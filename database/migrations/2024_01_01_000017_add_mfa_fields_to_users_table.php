<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('mfa_enabled')->default(false)->after('password');
            $table->enum('mfa_method', ['totp', 'email'])->nullable()->after('mfa_enabled');
            $table->string('mfa_secret')->nullable()->after('mfa_method');
            $table->text('mfa_backup_codes')->nullable()->after('mfa_secret');
            $table->timestamp('mfa_verified_at')->nullable()->after('mfa_backup_codes');
            $table->string('email_otp', 6)->nullable()->after('mfa_verified_at');
            $table->timestamp('email_otp_expires_at')->nullable()->after('email_otp');
            $table->boolean('is_active')->default(true)->after('email_otp_expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'mfa_enabled',
                'mfa_method',
                'mfa_secret',
                'mfa_backup_codes',
                'mfa_verified_at',
                'email_otp',
                'email_otp_expires_at',
                'is_active',
            ]);
        });
    }
};
