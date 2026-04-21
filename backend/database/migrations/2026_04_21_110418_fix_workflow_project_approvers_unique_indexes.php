<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workflow_project_approvers', function (Blueprint $table) {
            $table->dropUnique('unique_user_scope');
            $table->dropUnique('unique_role_scope');
            
            $table->unique(['workflow_step_id', 'scope_type', 'scope_id', 'document_type_id', 'user_id'], 'unique_user_scope_doc');
            $table->unique(['workflow_step_id', 'scope_type', 'scope_id', 'document_type_id', 'role_id'], 'unique_role_scope_doc');
        });
    }

    public function down(): void
    {
        Schema::table('workflow_project_approvers', function (Blueprint $table) {
            $table->dropUnique('unique_user_scope_doc');
            $table->dropUnique('unique_role_scope_doc');
            
            $table->unique(['workflow_step_id', 'scope_type', 'scope_id', 'user_id'], 'unique_user_scope');
            $table->unique(['workflow_step_id', 'scope_type', 'scope_id', 'role_id'], 'unique_role_scope');
        });
    }
};
