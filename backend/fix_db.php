<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// 1. Fix Enum
try {
    DB::statement("ALTER TABLE workflow_project_approvers MODIFY COLUMN scope_type ENUM('project', 'category', 'global') NOT NULL");
    echo "Fixed Enum scope_type.\n";
} catch (\Exception $e) {
    echo "Error fixing enum: " . $e->getMessage() . "\n";
}

// 2. Create workflows
$wfFinanceId = DB::table('workflows')->insertGetId([
    'workflow_code' => 'WF-TAICHINH',
    'workflow_name' => 'Quy trình duyệt Tài chính',
    'description' => 'Trình duyệt -> Phó giám đốc duyệt',
    'is_active' => 1,
    'created_at' => now()
]);

$wfOtherId = DB::table('workflows')->insertGetId([
    'workflow_code' => 'WF-KHAC',
    'workflow_name' => 'Quy trình duyệt Tài liệu khác',
    'description' => 'Trình duyệt -> Phó giám đốc duyệt',
    'is_active' => 1,
    'created_at' => now()
]);

// 3. Create steps
// Step 1: Placeholder
DB::table('workflow_steps')->insert([
    ['workflow_id' => $wfFinanceId, 'step_name' => 'Người lập kiểm tra', 'sort_order' => 1, 'role_id_assigned' => 999999, 'expected_days' => 1],
    ['workflow_id' => $wfFinanceId, 'step_name' => 'Phó Giám đốc duyệt cuối', 'sort_order' => 2, 'role_id_assigned' => 150001, 'expected_days' => 1],
    
    ['workflow_id' => $wfOtherId, 'step_name' => 'Gửi yêu cầu duyệt', 'sort_order' => 1, 'role_id_assigned' => 999999, 'expected_days' => 1],
    ['workflow_id' => $wfOtherId, 'step_name' => 'Phó Giám đốc duyệt cuối', 'sort_order' => 2, 'role_id_assigned' => 150001, 'expected_days' => 1],
]);

// 4. Update Document Types
DB::table('document_types')->where('id', 5)->update(['assigned_workflow_id' => $wfFinanceId]);
DB::table('document_types')->where('id', 30007)->update(['assigned_workflow_id' => $wfOtherId]);

echo "Workflows created and assigned.\n";
