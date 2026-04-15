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
        Schema::table('products', function (Blueprint $table) {
            // Drop old unique index on sku only
            $table->dropUnique('products_sku_unique');
            
            // Add new composite unique index: a specific SKU can only exist ONCE per WAREHOUSE
            $table->unique(['sku', 'warehouse_id'], 'products_sku_warehouse_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_sku_warehouse_unique');
            $table->unique('sku', 'products_sku_unique');
        });
    }
};
