<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

if (!Schema::hasTable('workflow_assignments')) {
    Schema::create('workflow_assignments', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('workflow_id');
        $table->unsignedBigInteger('document_type_id');
        $table->enum('scope_type', ['project', 'category', 'global']);
        $table->unsignedBigInteger('scope_id')->default(0); 
        $table->unsignedBigInteger('assigned_by');
        $table->timestamps();

        $table->foreign('workflow_id')->references('id')->on('workflows')->onDelete('cascade');
        $table->foreign('document_type_id')->references('id')->on('document_types')->onDelete('cascade');
        $table->foreign('assigned_by')->references('id')->on('users')->onDelete('cascade');
        
        // Ensure uniqueness: a specific document type within a specific scope can only have one workflow.
        $table->unique(['document_type_id', 'scope_type', 'scope_id'], 'unique_workflow_assignment');
    });
    echo "Tạo bảng workflow_assignments thành công.\n";
} else {
    echo "Bảng workflow_assignments đã tồn tại.\n";
}
