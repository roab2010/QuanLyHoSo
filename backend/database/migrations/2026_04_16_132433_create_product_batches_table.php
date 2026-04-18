<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('product_batches', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->date('hsd')->nullable();
            $table->decimal('quantity', 10, 2)->default(0);
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        // Migrate existing data
        $products = DB::table('products')->where('current_stock', '>', 0)->get();
        foreach ($products as $product) {
            DB::table('product_batches')->insert([
                'product_id' => $product->id,
                'hsd' => $product->hsd ?? null,
                'quantity' => $product->current_stock,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // We will keep the 'hsd' column on products temporarily to avoid random crashes, 
        // but it will be ignored by our new logic. Or we drop it to keep DB clean. Let's drop it!
        if (Schema::hasColumn('products', 'hsd')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('hsd');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->date('hsd')->nullable();
        });

        $batches = DB::table('product_batches')->get();
        foreach ($batches as $batch) {
            DB::table('products')->where('id', $batch->product_id)->update(['hsd' => $batch->hsd]);
        }

        Schema::dropIfExists('product_batches');
    }
};
