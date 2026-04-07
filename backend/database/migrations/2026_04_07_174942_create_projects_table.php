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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('project_code', 50)->unique();
            $table->unsignedBigInteger('category_id');
            $table->string('name', 255);
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('supervisor_id');
            $table->text('address');
            $table->date('start_date')->nullable();
            $table->enum('status', ['DRAFT', 'PENDING', 'PROCESSING', 'REVISION', 'COMPLETED', 'ON_HOLD'])->default('DRAFT');
            $table->enum('priority', ['LOW', 'MEDIUM', 'HIGH'])->default('MEDIUM');
            $table->timestamp('created_at')->useCurrent();
            $table->decimal('max_warehouse_capacity', 15, 2)->default(1000.00);
            $table->timestamp('status_updated_at')->nullable()->useCurrentOnUpdate();

            // Ràng buộc
            $table->foreign('category_id')->references('id')->on('project_categories')->onDelete('restrict');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('restrict');
            $table->foreign('supervisor_id')->references('id')->on('employees')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
