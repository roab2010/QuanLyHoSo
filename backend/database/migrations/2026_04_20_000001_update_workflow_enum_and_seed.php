<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Cập nhật ENUM
        DB::statement("ALTER TABLE document_workflow_logs MODIFY COLUMN action ENUM('SUBMIT','APPROVE','REJECT','REVISE','RESUBMIT') NOT NULL");

        $now = Carbon::now();

        // 2. Seed Workflows
        DB::table('workflows')->insert([
            ['workflow_code' => 'WF-BANDVE', 'workflow_name' => 'Quy trình duyệt bản vẽ thiết kế', 'description' => 'Quy trình 2 bước: Kỹ sư kiểm tra → Giám đốc ký duyệt', 'is_active' => 1, 'created_at' => $now],
            ['workflow_code' => 'WF-HOPDONG', 'workflow_name' => 'Quy trình duyệt hợp đồng', 'description' => 'Quy trình 2 bước: Trưởng phòng duyệt → Phó Giám đốc ký', 'is_active' => 1, 'created_at' => $now],
            ['workflow_code' => 'WF-NGHIEMTHU', 'workflow_name' => 'Quy trình duyệt nghiệm thu', 'description' => 'Quy trình 2 bước: Giám sát thi công kiểm tra → Giám đốc ký', 'is_active' => 1, 'created_at' => $now],
        ]);

        $wf1 = DB::table('workflows')->where('workflow_code', 'WF-BANDVE')->value('id');
        $wf2 = DB::table('workflows')->where('workflow_code', 'WF-HOPDONG')->value('id');
        $wf3 = DB::table('workflows')->where('workflow_code', 'WF-NGHIEMTHU')->value('id');

        // --- PHẦN QUAN TRỌNG: Lấy ID từ bảng roles thay vì dùng số cứng ---
        // Lưu ý: Hãy chắc chắn tên (name) dưới đây khớp với tên trong bảng roles của bạn
        $roleAdmin       = DB::table('roles')->where('name', 'like', '%Admin%')->orWhere('name', 'like', '%Giám đốc%')->value('id') ?? 1;
        $roleKySu        = DB::table('roles')->where('name', 'like', '%Kỹ sư%')->value('id');
        $roleTruongPhong  = DB::table('roles')->where('name', 'like', '%Trưởng phòng%')->value('id');
        $rolePhoGD       = DB::table('roles')->where('name', 'like', '%Phó Giám đốc%')->value('id');
        $roleGiamSat     = DB::table('roles')->where('name', 'like', '%Giám sát%')->value('id');

        // 3. Seed Workflow Steps
        DB::table('workflow_steps')->insert([
            // WF-BANDVE
            ['workflow_id' => $wf1, 'step_name' => 'Kỹ sư kiểm tra bản vẽ', 'sort_order' => 1, 'expected_days' => 2, 'role_id_assigned' => $roleKySu, 'has_digital_signature' => 0, 'requires_survey' => 0],
            ['workflow_id' => $wf1, 'step_name' => 'Giám đốc ký duyệt',     'sort_order' => 2, 'expected_days' => 1, 'role_id_assigned' => $roleAdmin, 'has_digital_signature' => 1, 'requires_survey' => 0],

            // WF-HOPDONG
            ['workflow_id' => $wf2, 'step_name' => 'Trưởng phòng xem xét', 'sort_order' => 1, 'expected_days' => 2, 'role_id_assigned' => $roleTruongPhong, 'has_digital_signature' => 0, 'requires_survey' => 0],
            ['workflow_id' => $wf2, 'step_name' => 'Phó Giám đốc ký duyệt', 'sort_order' => 2, 'expected_days' => 1, 'role_id_assigned' => $rolePhoGD, 'has_digital_signature' => 1, 'requires_survey' => 0],

            // WF-NGHIEMTHU
            ['workflow_id' => $wf3, 'step_name' => 'Giám sát thi công kiểm tra', 'sort_order' => 1, 'expected_days' => 3, 'role_id_assigned' => $roleGiamSat, 'has_digital_signature' => 0, 'requires_survey' => 1],
            ['workflow_id' => $wf3, 'step_name' => 'Giám đốc ký nghiệm thu',    'sort_order' => 2, 'expected_days' => 1, 'role_id_assigned' => $roleAdmin, 'has_digital_signature' => 1, 'requires_survey' => 0],
        ]);

        // 4. Seed Document Types
        DB::table('document_types')->insert([
            ['group_name' => 'Kỹ thuật', 'type_name' => 'Bản vẽ thiết kế', 'icon_name' => 'file-text', 'theme_color' => 'blue', 'assigned_workflow_id' => $wf1, 'created_at' => $now],
            ['group_name' => 'Kỹ thuật', 'type_name' => 'Bản vẽ hoàn công', 'icon_name' => 'file-text', 'theme_color' => 'indigo', 'assigned_workflow_id' => $wf1, 'created_at' => $now],
            ['group_name' => 'Pháp lý', 'type_name' => 'Hợp đồng', 'icon_name' => 'file', 'theme_color' => 'green', 'assigned_workflow_id' => $wf2, 'created_at' => $now],
            ['group_name' => 'Pháp lý', 'type_name' => 'Phụ lục hợp đồng', 'icon_name' => 'file', 'theme_color' => 'teal', 'assigned_workflow_id' => $wf2, 'created_at' => $now],
            ['group_name' => 'Nghiệm thu', 'type_name' => 'Biên bản nghiệm thu', 'icon_name' => 'check', 'theme_color' => 'orange', 'assigned_workflow_id' => $wf3, 'created_at' => $now],
            ['group_name' => 'Nghiệm thu', 'type_name' => 'Biên bản bàn giao', 'icon_name' => 'check', 'theme_color' => 'amber', 'assigned_workflow_id' => $wf3, 'created_at' => $now],
            ['group_name' => 'Khác', 'type_name' => 'Tài liệu khác', 'icon_name' => 'folder', 'theme_color' => 'gray', 'assigned_workflow_id' => null, 'created_at' => $now],
        ]);
    }

    public function down(): void
    {
        // Khi dùng truncate nên cẩn thận, có thể dùng delete() nếu có khóa ngoại
        DB::table('document_types')->delete();
        DB::table('workflow_steps')->delete();
        DB::table('workflows')->delete();
        DB::statement("ALTER TABLE document_workflow_logs MODIFY COLUMN action ENUM('SUBMIT','APPROVE','REJECT','REVISE') NOT NULL");
    }
};
