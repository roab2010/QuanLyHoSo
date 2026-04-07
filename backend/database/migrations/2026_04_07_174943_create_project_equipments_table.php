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
        Schema::create('project_equipments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('product_id');
            $table->decimal('quantity_dispatched', 15, 2);
            $table->decimal('quantity_returned', 15, 2)->default(0);
            $table->date('dispatched_date');
            $table->enum('status', ['IN_USE', 'PARTIALLY_RETURNED', 'FULLY_RETURNED'])->default('IN_USE');

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_equipments');
    }
};
