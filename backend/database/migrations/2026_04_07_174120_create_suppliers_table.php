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
        if (Schema::hasTable('suppliers')) {
            return;
        }

        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('supplier_code', 20)->unique();
            $table->string('tax_code', 20)->nullable();
            $table->string('main_material_type', 100)->nullable();
            $table->string('name', 150);
            $table->text('logo_url')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->text('address')->nullable();
            $table->enum('status', ['ACTIVE', 'SUSPENDED', 'PENDING'])->default('ACTIVE');
            $table->decimal('rating_stars', 2, 1)->default(5.0);
            $table->enum('evaluation_tag', ['TIN_CAY', 'TIEM_NANG', 'CAN_XEM_SET'])->default('TIEM_NANG');
            $table->boolean('is_strategic')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
