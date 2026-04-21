<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('project_tasks', 'estimated_finish_date')) {
                $table->date('estimated_finish_date')->nullable()->after('estimated_completion_date');
            }
            if (!Schema::hasColumn('project_tasks', 'actual_finish_date')) {
                $table->date('actual_finish_date')->nullable()->after('completed_date');
            }
        });

        Schema::table('project_documents', function (Blueprint $table) {
            if (!Schema::hasColumn('project_documents', 'estimated_finish_date')) {
                $table->date('estimated_finish_date')->nullable()->after('uploaded_at');
            }
            if (!Schema::hasColumn('project_documents', 'actual_finish_date')) {
                $table->date('actual_finish_date')->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('project_tasks', function (Blueprint $table) {
            $table->dropColumn(['estimated_finish_date', 'actual_finish_date']);
        });

        Schema::table('project_documents', function (Blueprint $table) {
            $table->dropColumn(['estimated_finish_date', 'actual_finish_date']);
        });
    }
};
