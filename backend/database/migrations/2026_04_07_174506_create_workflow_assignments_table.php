<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bảng gán quy trình duyệt vào loại tài liệu theo phạm vi.
     * Khác với workflow_project_approvers (ai được duyệt),
     * bảng này xác định WORKFLOW NÀO áp dụng cho loại tài liệu ở scope nào.
     *
     * Thứ tự ưu tiên tìm workflow: project > category > global
     */
    public function up(): void
    {
        if (Schema::hasTable('workflow_assignments')) {
            return; // Bảng đã tồn tại (VD: trên môi trường cũ chưa có migration này)
        }

        Schema::create('workflow_assignments', function (Blueprint $table) {
            $table->id();

            // Quy trình được gán
            $table->unsignedBigInteger('workflow_id');

            // Loại tài liệu cụ thể (nullable nếu gán theo nhóm)
            $table->unsignedBigInteger('document_type_id')->nullable();

            // Gán theo nhóm hồ sơ (nullable nếu gán theo loại cụ thể)
            $table->string('document_group_name', 100)->nullable();

            // Phạm vi áp dụng
            $table->enum('scope_type', ['global', 'project', 'category']);
            $table->unsignedBigInteger('scope_id')->default(0); // 0 = global

            // Người thực hiện gán
            $table->unsignedBigInteger('assigned_by')->nullable();

            $table->timestamp('created_at')->useCurrent();

            // Index tìm kiếm nhanh
            $table->index(['scope_type', 'scope_id']);
            $table->index(['document_type_id']);
            $table->index(['workflow_id']);

            // Foreign keys
            $table->foreign('workflow_id')->references('id')->on('workflows')->onDelete('cascade');
            $table->foreign('document_type_id')->references('id')->on('document_types')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_assignments');
    }
};
