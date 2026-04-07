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
        Schema::create('document_types', function (Blueprint $table) {
            $table->id();
            $table->string('group_name', 100);
            $table->string('type_name', 255);
            $table->string('icon_name', 50)->default('file-text');
            $table->string('theme_color', 20)->default('blue');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('assigned_workflow_id')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('assigned_workflow_id')->references('id')->on('workflows')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_types');
    }
};
