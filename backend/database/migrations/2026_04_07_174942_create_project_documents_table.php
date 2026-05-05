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
        Schema::create('project_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->string('document_name', 255);
            $table->unsignedBigInteger('document_type_id');
            $table->text('file_url')->nullable();
            $table->timestamp('uploaded_at')->useCurrent();
            $table->enum('status', ['PENDING', 'PROCESSING', 'REVISION', 'COMPLETED'])->default('PENDING');
            $table->text('note')->nullable();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');

            $table->foreign('document_type_id')
                ->references('id')->on('document_types')
                ->onDelete('restrict');
            $table->unsignedBigInteger('current_step_id')->nullable();

            $table->foreign('current_step_id')
                ->references('id')->on('workflow_steps')
                ->onDelete('set null')
                ->onUpdate('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_documents');
    }
};
