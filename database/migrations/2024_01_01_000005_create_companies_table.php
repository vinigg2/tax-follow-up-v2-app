<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('cnpj', 20);
            $table->string('name', 30);
            $table->string('country', 2)->nullable();
            $table->string('logo', 200)->nullable();
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->boolean('deleted')->default(false);
            $table->timestamps();

            $table->unique(['cnpj', 'group_id']);
            $table->index('group_id');
            $table->index('deleted');
            $table->index('country');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
