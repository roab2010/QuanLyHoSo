<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('category_document_templates', function (Blueprint $table) {
            // Tên tài liệu cụ thể (VD: CCCD, Giấy chứng nhận QSDĐ...)
            $table->string('document_name', 255)->nullable()->after('document_type_id');
            // Thứ tự hiển thị
            $table->unsignedInteger('sort_order')->default(1)->after('document_name');
            // Làm document_type_id nullable (có thể chưa chọn loại)
            $table->unsignedBigInteger('document_type_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('category_document_templates', function (Blueprint $table) {
            $table->dropColumn(['document_name', 'sort_order']);
            $table->unsignedBigInteger('document_type_id')->nullable(false)->change();
        });
    }
};
