<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->boolean('is_admin')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'group_id']);
            $table->index('user_id');
            $table->index('group_id');
            $table->index('is_admin');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_groups');
    }
};
