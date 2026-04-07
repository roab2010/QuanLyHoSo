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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->string('job_title', 100)->nullable();
            $table->unsignedBigInteger('user_id')->nullable()->unique();
            $table->string('employee_code', 20)->unique();
            $table->string('full_name', 100);
            $table->string('email', 100)->nullable();
            $table->text('avatar')->nullable();
            $table->string('phone', 20)->nullable();
            $table->enum('status', ['WORKING', 'ON_LEAVE', 'RESIGNED'])->default('WORKING');
            $table->timestamp('created_at')->useCurrent();

            // Ràng buộc khóa ngoại
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
