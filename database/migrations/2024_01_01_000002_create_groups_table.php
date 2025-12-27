<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->string('name', 30);
            $table->foreignId('owner_id')->constrained('users')->onDelete('restrict');
            $table->boolean('deleted')->default(false);
            $table->timestamps();

            $table->index('owner_id');
            $table->index('deleted');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('groups');
    }
};
