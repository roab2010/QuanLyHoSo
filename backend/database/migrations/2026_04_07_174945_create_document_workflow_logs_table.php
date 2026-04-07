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
        Schema::create('document_workflow_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('document_id');
            $table->unsignedBigInteger('step_id');
            $table->unsignedBigInteger('processor_id');
            $table->enum('action', ['SUBMIT', 'APPROVE', 'REJECT', 'REVISE']);
            $table->text('comment')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('document_id')->references('id')->on('project_documents')->onDelete('cascade');
            $table->foreign('step_id')->references('id')->on('workflow_steps')->onDelete('cascade');
            $table->foreign('processor_id')->references('id')->on('employees')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_workflow_logs');
    }
};
