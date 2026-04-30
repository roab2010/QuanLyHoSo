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
        Schema::table('project_documents', function (Blueprint $table) {
            if (!Schema::hasColumn('project_documents', 'actual_finish_date')) {
                $table->date('actual_finish_date')->nullable()->after('estimated_finish_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_documents', function (Blueprint $table) {
            if (Schema::hasColumn('project_documents', 'actual_finish_date')) {
                $table->dropColumn('actual_finish_date');
            }
        });
    }
};
