<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_members', function (Blueprint $table) {
            // Thêm field
            $table->unsignedBigInteger('project_position_id')->nullable()->after('employee_id');
            // Khóa ngoại
            $table->foreign('project_position_id', 'fk_member_position')
                  ->references('id')->on('project_position_titles')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('project_members', function (Blueprint $table) {
            $table->dropForeign('fk_member_position');
            $table->dropColumn('project_position_id');
        });
    }
};
