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
            $table->unsignedBigInteger('warehouse_id')->nullable();
            $table->string('unit', 20)->nullable();
            $table->enum('type', ['CONSUMABLE', 'RETURNABLE']);
            $table->string('category_name', 100)->nullable();
            $table->decimal('price', 15, 2)->default(0);
            $table->boolean('status')->default(true);
            $table->decimal('min_stock_level', 15, 2)->default(0);
            $table->decimal('current_stock', 15, 2)->default(0);
            $table->decimal('space_coefficient', 10, 2);
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->foreign('warehouse_id', 'fk_products_warehouse')
                ->references('id')
                ->on('warehouses')
                ->onDelete('set null')
                ->onUpdate('cascade');
            // FK supplier_id được thêm ở migration riêng (2026_04_07_174124)
            // vì suppliers và products cùng timestamp 174123, products chạy trước alphabetically

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
