<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Cập nhật ENUM - thêm RESUBMIT (Idempotent check)
        $column = DB::select("SHOW COLUMNS FROM document_workflow_logs WHERE Field = 'action'")[0];
        if (!str_contains($column->Type, 'RESUBMIT')) {
            DB::statement("ALTER TABLE document_workflow_logs MODIFY COLUMN action ENUM('SUBMIT','APPROVE','REJECT','REVISE','RESUBMIT') NOT NULL");
        }

        // 2. Lấy hoặc tạo Role IDs để tránh lỗi Foreign Key
        $roles = [
            'admin' => 'admin',
            'pho_gd' => 'Phó Giám đốc',
            'truong_phong' => 'Trưởng phòng',
            'ky_su' => 'Kỹ sư công trường',
            'giam_sat' => 'Giám sát thi công'
        ];

        $roleIds = [];
        foreach ($roles as $key => $name) {
            $id = DB::table('roles')->where('name', $name)->value('id');
            if (!$id) {
                $id = DB::table('roles')->insertGetId([
                    'name' => $name,
                    'level' => ($key == 'admin' ? 1 : ($key == 'pho_gd' ? 2 : 3)),
                    'status' => 1,
                    'created_at' => now()
                ]);
            }
            $roleIds[$key] = $id;
        }

        // 3. Seed Workflows (Idempotent)
        $now = now();
        $workflowData = [
            [
                'workflow_code' => 'WF-BANDVE',
                'workflow_name' => 'Quy trình duyệt bản vẽ thiết kế',
                'description'   => 'Quy trình 2 bước: Kỹ sư kiểm tra → Giám đốc ký duyệt',
                'is_active'     => 1,
                'created_at'    => $now,
            ],
            [
                'workflow_code' => 'WF-HOPDONG',
                'workflow_name' => 'Quy trình duyệt hợp đồng',
                'description'   => 'Quy trình 2 bước: Trưởng phòng duyệt → Phó Giám đốc ký',
                'is_active'     => 1,
                'created_at'    => $now,
            ],
            [
                'workflow_code' => 'WF-NGHIEMTHU',
                'workflow_name' => 'Quy trình duyệt nghiệm thu',
                'description'   => 'Quy trình 2 bước: Giám sát thi công kiểm tra → Giám đốc ký',
                'is_active'     => 1,
                'created_at'    => $now,
            ],
        ];

        foreach ($workflowData as $data) {
            DB::table('workflows')->updateOrInsert(['workflow_code' => $data['workflow_code']], $data);
        }

        $wf1 = DB::table('workflows')->where('workflow_code', 'WF-BANDVE')->value('id');
        $wf2 = DB::table('workflows')->where('workflow_code', 'WF-HOPDONG')->value('id');
        $wf3 = DB::table('workflows')->where('workflow_code', 'WF-NGHIEMTHU')->value('id');

        // 4. Seed Workflow Steps (Idempotent: Clear and Re-insert for these specific workflows)
        DB::table('workflow_steps')->whereIn('workflow_id', [$wf1, $wf2, $wf3])->delete();
        
        DB::table('workflow_steps')->insert([
            // WF-BANDVE: Kỹ sư → Admin (Giám đốc)
            ['workflow_id' => $wf1, 'step_name' => 'Kỹ sư kiểm tra bản vẽ', 'sort_order' => 1, 'expected_days' => 2, 'role_id_assigned' => $roleIds['ky_su'], 'has_digital_signature' => 0, 'requires_survey' => 0],
            ['workflow_id' => $wf1, 'step_name' => 'Giám đốc ký duyệt',     'sort_order' => 2, 'expected_days' => 1, 'role_id_assigned' => $roleIds['admin'], 'has_digital_signature' => 1, 'requires_survey' => 0],

            // WF-HOPDONG: Trưởng phòng → Phó Giám đốc
            ['workflow_id' => $wf2, 'step_name' => 'Trưởng phòng xem xét', 'sort_order' => 1, 'expected_days' => 2, 'role_id_assigned' => $roleIds['truong_phong'], 'has_digital_signature' => 0, 'requires_survey' => 0],
            ['workflow_id' => $wf2, 'step_name' => 'Phó Giám đốc ký duyệt', 'sort_order' => 2, 'expected_days' => 1, 'role_id_assigned' => $roleIds['pho_gd'], 'has_digital_signature' => 1, 'requires_survey' => 0],

            // WF-NGHIEMTHU: Giám sát → Admin (Giám đốc)
            ['workflow_id' => $wf3, 'step_name' => 'Giám sát thi công kiểm tra', 'sort_order' => 1, 'expected_days' => 3, 'role_id_assigned' => $roleIds['giam_sat'], 'has_digital_signature' => 0, 'requires_survey' => 1],
            ['workflow_id' => $wf3, 'step_name' => 'Giám đốc ký nghiệm thu',    'sort_order' => 2, 'expected_days' => 1, 'role_id_assigned' => $roleIds['admin'], 'has_digital_signature' => 1, 'requires_survey' => 0],
        ]);

        // 5. Seed Document Types (Idempotent)
        $docTypes = [
            ['group_name' => 'Kỹ thuật',    'type_name' => 'Bản vẽ thiết kế',         'icon_name' => 'file-text',  'theme_color' => 'blue',   'assigned_workflow_id' => $wf1, 'created_at' => $now],
            ['group_name' => 'Kỹ thuật',    'type_name' => 'Bản vẽ hoàn công',         'icon_name' => 'file-text',  'theme_color' => 'indigo', 'assigned_workflow_id' => $wf1, 'created_at' => $now],
            ['group_name' => 'Pháp lý',     'type_name' => 'Hợp đồng',                 'icon_name' => 'file',       'theme_color' => 'green',  'assigned_workflow_id' => $wf2, 'created_at' => $now],
            ['group_name' => 'Pháp lý',     'type_name' => 'Phụ lục hợp đồng',         'icon_name' => 'file',       'theme_color' => 'teal',   'assigned_workflow_id' => $wf2, 'created_at' => $now],
            ['group_name' => 'Nghiệm thu',  'type_name' => 'Biên bản nghiệm thu',       'icon_name' => 'check',      'theme_color' => 'orange', 'assigned_workflow_id' => $wf3, 'created_at' => $now],
            ['group_name' => 'Nghiệm thu',  'type_name' => 'Biên bản bàn giao',         'icon_name' => 'check',      'theme_color' => 'amber',  'assigned_workflow_id' => $wf3, 'created_at' => $now],
            ['group_name' => 'Khác',        'type_name' => 'Tài liệu khác',             'icon_name' => 'folder',     'theme_color' => 'gray',   'assigned_workflow_id' => null, 'created_at' => $now],
        ];

        foreach ($docTypes as $dt) {
            DB::table('document_types')->updateOrInsert(['type_name' => $dt['type_name']], $dt);
        }
    }

    public function down(): void
    {
        DB::table('document_types')->truncate();
        DB::table('workflow_steps')->truncate();
        DB::table('workflows')->truncate();
        DB::statement("ALTER TABLE document_workflow_logs MODIFY COLUMN action ENUM('SUBMIT','APPROVE','REJECT','REVISE') NOT NULL");
    }
};
