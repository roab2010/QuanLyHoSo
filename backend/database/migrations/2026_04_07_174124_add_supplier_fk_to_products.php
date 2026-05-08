<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Thêm FK supplier_id vào bảng products SAU KHI suppliers đã được tạo.
     * Tách ra khỏi create_products_table vì cả 2 có cùng timestamp 174123.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Chỉ thêm FK nếu chưa tồn tại (idempotent)
            if (!Schema::hasColumn('products', 'supplier_id')) {
                return;
            }

            // Kiểm tra FK đã tồn tại chưa trước khi thêm
            try {
                $table->foreign('supplier_id')
                    ->references('id')
                    ->on('suppliers')
                    ->onDelete('set null')
                    ->onUpdate('restrict');
            } catch (\Exception $e) {
                // FK đã tồn tại, bỏ qua
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            try {
                $table->dropForeign(['supplier_id']);
            } catch (\Exception $e) {
                // FK không tồn tại, bỏ qua
            }
        });
    }
};
