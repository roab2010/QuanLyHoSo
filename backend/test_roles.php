<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$roles = ['admin' => 'admin', 'pho_gd' => 'Phó Giám đốc', 'truong_phong' => 'Trưởng phòng', 'ky_su' => 'Kỹ sư công trường', 'giam_sat' => 'Giám sát thi công'];
$roleIds = [];
foreach ($roles as $key => $name) {
    $id = \Illuminate\Support\Facades\DB::table('roles')->where('name', $name)->value('id');
    if (!$id) {
        $id = \Illuminate\Support\Facades\DB::table('roles')->insertGetId([
            'name' => $name,
            'level' => ($key == 'admin' ? 1 : ($key == 'pho_gd' ? 2 : 3)),
            'status' => 1,
            'created_at' => now()
        ]);
    }
    $roleIds[$key] = $id;
}
echo json_encode($roleIds) . "\n";
