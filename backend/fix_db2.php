<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Fix remaining workflow IDs by deleting the invalid ones, finding the correct ones.
$wfFinance = DB::table('workflows')->where('workflow_code', 'WF-TAICHINH')->first();
$wfOther = DB::table('workflows')->where('workflow_code', 'WF-KHAC')->first();

if (!$wfFinance) {
    $wfFinanceId = DB::table('workflows')->insertGetId([
        'workflow_code' => 'WF-TAICHINH',
        'workflow_name' => 'Quy trình duyệt Tài chính',
        'description' => 'Trình duyệt -> Phó giám đốc duyệt',
        'is_active' => 1,
        'created_at' => now()
    ]);
} else {
    $wfFinanceId = $wfFinance->id;
}

if (!$wfOther) {
    $wfOtherId = DB::table('workflows')->insertGetId([
        'workflow_code' => 'WF-KHAC',
        'workflow_name' => 'Quy trình duyệt Tài liệu khác',
        'description' => 'Trình duyệt -> Phó giám đốc duyệt',
        'is_active' => 1,
        'created_at' => now()
    ]);
} else {
    $wfOtherId = $wfOther->id;
}

// 3. Create steps (Only if not exist)
if (!DB::table('workflow_steps')->where('workflow_id', $wfFinanceId)->exists()) {
    DB::table('workflow_steps')->insert([
        ['workflow_id' => $wfFinanceId, 'step_name' => 'Người lập kiểm tra', 'sort_order' => 1, 'role_id_assigned' => null, 'expected_days' => 1],
        ['workflow_id' => $wfFinanceId, 'step_name' => 'Phó Giám đốc duyệt cuối', 'sort_order' => 2, 'role_id_assigned' => 150001, 'expected_days' => 1]
    ]);
}

if (!DB::table('workflow_steps')->where('workflow_id', $wfOtherId)->exists()) {
    DB::table('workflow_steps')->insert([
        ['workflow_id' => $wfOtherId, 'step_name' => 'Gửi yêu cầu duyệt', 'sort_order' => 1, 'role_id_assigned' => null, 'expected_days' => 1],
        ['workflow_id' => $wfOtherId, 'step_name' => 'Phó Giám đốc duyệt cuối', 'sort_order' => 2, 'role_id_assigned' => 150001, 'expected_days' => 1]
    ]);
}

// 4. Update Document Types
DB::table('document_types')->where('id', 5)->update(['assigned_workflow_id' => $wfFinanceId]);
DB::table('document_types')->where('id', 30007)->update(['assigned_workflow_id' => $wfOtherId]);

echo "Workflows created and assigned.\n";
