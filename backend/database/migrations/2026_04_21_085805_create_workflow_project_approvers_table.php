<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_project_approvers', function (Blueprint $table) {
            $table->id();

            // Bước duyệt nào được phân quyền
            $table->unsignedBigInteger('workflow_step_id');

            // Phạm vi áp dụng: dự án cụ thể hay danh mục
            $table->enum('scope_type', ['project', 'category']);
            $table->unsignedBigInteger('scope_id'); // project_id hoặc category_id

            // Người được cấp quyền (chọn một trong hai)
            $table->unsignedBigInteger('user_id')->nullable(); // Người cụ thể
            $table->unsignedBigInteger('role_id')->nullable();  // Hoặc cả nhóm Role

            // Ai cấp quyền (phải là Admin)
            $table->unsignedBigInteger('granted_by');

            $table->timestamps();

            // Tránh trùng lặp
            $table->unique(['workflow_step_id', 'scope_type', 'scope_id', 'user_id'], 'unique_user_scope');
            $table->unique(['workflow_step_id', 'scope_type', 'scope_id', 'role_id'], 'unique_role_scope');

            // Index để tra cứu nhanh
            $table->index(['user_id']);
            $table->index(['role_id']);
            $table->index(['scope_type', 'scope_id']);
            $table->index(['workflow_step_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_project_approvers');
    }
};
