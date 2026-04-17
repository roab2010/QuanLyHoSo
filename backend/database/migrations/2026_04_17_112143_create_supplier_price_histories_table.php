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
        Schema::create('supplier_price_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_material_id')->constrained('supplier_materials')->onDelete('cascade');
            $table->decimal('old_price', 15, 2)->default(0);
            $table->decimal('new_price', 15, 2)->default(0);
            $table->text('note')->nullable(); // Lí do đổi giá
            $table->timestamp('changed_at')->useCurrent(); // Thời điểm thay đổi
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_price_histories');
    }
};
