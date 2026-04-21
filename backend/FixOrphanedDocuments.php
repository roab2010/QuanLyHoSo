<?php

use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Starting Orphaned Document Repair...\n";

// 1. Tìm các tài liệu PENDING nhưng thiếu current_step_id
$orphanedDocs = DB::table('project_documents')
    ->whereIn('status', ['PENDING', 'PROCESSING', 'REVISION'])
    ->whereNull('current_step_id')
    ->whereNotNull('file_url') // Chỉ xử lý các tài liệu đã có file (không phải slot trống)
    ->get();

echo "Found " . $orphanedDocs->count() . " orphaned documents.\n";

foreach ($orphanedDocs as $doc) {
    echo "Processing Document ID: {$doc->id} - {$doc->document_name}\n";
    
    // Tìm loại tài liệu
    $docType = DB::table('document_types')->where('id', $doc->document_type_id)->first();
    
    if (!$docType || !$docType->assigned_workflow_id) {
        echo "  - No workflow assigned to Document Type ID: {$doc->document_type_id}. Skipping.\n";
        continue;
    }
    
    // Tìm bước đầu tiên
    $firstStep = DB::table('workflow_steps')
        ->where('workflow_id', $docType->assigned_workflow_id)
        ->orderBy('sort_order', 'asc')
        ->first();
        
    if (!$firstStep) {
        echo "  - No steps found for Workflow ID: {$docType->assigned_workflow_id}. Skipping.\n";
        continue;
    }
    
    // Cập nhật tài liệu
    DB::table('project_documents')->where('id', $doc->id)->update([
        'current_step_id' => $firstStep->id
    ]);
    
    // Ghi log SUBMIT nếu chưa có log nào cho tài liệu này
    $hasLog = DB::table('document_workflow_logs')->where('document_id', $doc->id)->exists();
    if (!$hasLog) {
        DB::table('document_workflow_logs')->insert([
            'document_id' => $doc->id,
            'step_id'     => $firstStep->id,
            'processor_id' => 1,
            'action'      => 'SUBMIT',
            'comment'     => 'Hệ thống tự động kích hoạt lại quy trình (Repair Script)',
            'created_at'  => now()
        ]);
        echo "  - Initial log created.\n";
    }
    
    echo "  - Successfully assigned to Step: {$firstStep->step_name} (ID: {$firstStep->id})\n";
}

echo "Repair Complete.\n";
