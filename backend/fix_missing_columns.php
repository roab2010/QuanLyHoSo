<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

if (!Schema::hasColumn('category_task_templates', 'estimated_completion_date')) {
    Schema::table('category_task_templates', function (Blueprint $table) {
        $table->integer('estimated_completion_date')->nullable();
    });
    echo "Added estimated_completion_date to category_task_templates\n";
} else {
    echo "Column already exists in category_task_templates\n";
}

if (!Schema::hasColumn('project_tasks', 'estimated_completion_date')) {
    Schema::table('project_tasks', function (Blueprint $table) {
        $table->integer('estimated_completion_date')->nullable();
    });
    echo "Added estimated_completion_date to project_tasks\n";
} else {
    echo "Column already exists in project_tasks\n";
}
