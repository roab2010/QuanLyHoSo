<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workflow_project_approvers', function (Blueprint $table) {
            if (!Schema::hasColumn('workflow_project_approvers', 'document_type_id')) {
                $table->unsignedBigInteger('document_type_id')->nullable()->after('scope_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('workflow_project_approvers', function (Blueprint $table) {
            if (Schema::hasColumn('workflow_project_approvers', 'document_type_id')) {
                $table->dropColumn('document_type_id');
            }
        });
    }
};
