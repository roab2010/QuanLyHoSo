<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('labor_attendance', function (Blueprint $table) {
            $table->id();

            // Khóa ngoại nối với bảng project_labors
            $table->foreignId('project_labor_id')
                ->constrained('project_labors')
                ->cascadeOnDelete(); // Nếu xóa đội thợ thì xóa luôn lịch sử điểm danh của đội đó

            $table->date('work_date');
            $table->integer('present_count')->default(0);

            // Cột note cho phép để trống (nullable)
            $table->text('note')->nullable();

            // Mặc định của Laravel: tự sinh 2 cột created_at và updated_at
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('labor_attendance');
    }
};
