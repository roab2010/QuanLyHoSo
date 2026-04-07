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
        Schema::create('workflow_steps', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workflow_id');
            $table->string('step_name', 255);
            $table->text('step_description')->nullable();
            $table->integer('sort_order')->default(1);
            $table->integer('expected_days')->default(1);
            $table->unsignedBigInteger('role_id_assigned')->nullable();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->boolean('has_digital_signature')->default(false);
            $table->boolean('requires_survey')->default(false);

            $table->foreign('workflow_id')->references('id')->on('workflows')->onDelete('cascade');
            $table->foreign('role_id_assigned')->references('id')->on('roles')->onDelete('set null');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_steps');
    }
};
