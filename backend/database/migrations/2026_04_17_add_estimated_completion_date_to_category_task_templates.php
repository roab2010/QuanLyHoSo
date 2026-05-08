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
        if (Schema::hasColumn('category_task_templates', 'estimated_completion_date')) {
            return;
        }

        Schema::table('category_task_templates', function (Blueprint $table) {
            $table->date('estimated_completion_date')->nullable()->after('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('category_task_templates', function (Blueprint $table) {
            $table->dropColumn('estimated_completion_date');
        });
    }
};
