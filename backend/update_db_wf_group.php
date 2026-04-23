<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

echo "Đang cập nhật bảng workflow_assignments...\n";

Schema::table('workflow_assignments', function (Blueprint $table) {
    // 1. Xóa ràng buộc cũ (nếu có thể) - Thường là tên unique index
    try {
        $table->dropUnique('unique_workflow_assignment');
    } catch (\Exception $e) {
        echo "Lưu ý: Không tìm thấy index unique_workflow_assignment để xóa.\n";
    }

    // 2. Chuyển document_type_id thành nullable
    $table->unsignedBigInteger('document_type_id')->nullable()->change();

    // 3. Thêm cột document_group_name
    if (!Schema::hasColumn('workflow_assignments', 'document_group_name')) {
        $table->string('document_group_name')->nullable()->after('document_type_id');
    }
});

// 4. Tạo ràng buộc Unique mới bao phủ cả nhóm
Schema::table('workflow_assignments', function (Blueprint $table) {
    $table->unique(['document_type_id', 'document_group_name', 'scope_type', 'scope_id'], 'unique_wf_assign_v2');
});

echo "Cập nhập Database thành công!\n";
