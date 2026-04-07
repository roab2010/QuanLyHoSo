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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('sku', 50)->unique();
            $table->string('name', 200);
            $table->string('unit', 20)->nullable();
            $table->enum('type', ['CONSUMABLE', 'RETURNABLE']);
            $table->string('category_name', 100)->nullable();
            $table->decimal('price', 15, 2)->default(0);
            $table->boolean('status')->default(true);
            $table->decimal('min_stock_level', 15, 2)->default(0);
            $table->decimal('current_stock', 15, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
