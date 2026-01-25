<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add the new role column
        Schema::table('user_groups', function (Blueprint $table) {
            $table->enum('role', ['admin', 'manager', 'member'])->default('member')->after('group_id');
        });

        // Migrate existing data: is_admin = true -> 'admin', is_admin = false -> 'member'
        DB::table('user_groups')->where('is_admin', true)->update(['role' => 'admin']);
        DB::table('user_groups')->where('is_admin', false)->update(['role' => 'member']);

        // Remove the old is_admin column
        Schema::table('user_groups', function (Blueprint $table) {
            $table->dropIndex(['is_admin']);
            $table->dropColumn('is_admin');
        });

        // Add index on role
        Schema::table('user_groups', function (Blueprint $table) {
            $table->index('role');
        });
    }

    public function down(): void
    {
        // Add back the is_admin column
        Schema::table('user_groups', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('group_id');
        });

        // Migrate data back: 'admin' -> is_admin = true, others -> is_admin = false
        DB::table('user_groups')->where('role', 'admin')->update(['is_admin' => true]);

        // Remove the role column
        Schema::table('user_groups', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropColumn('role');
        });

        // Add back the index
        Schema::table('user_groups', function (Blueprint $table) {
            $table->index('is_admin');
        });
    }
};
