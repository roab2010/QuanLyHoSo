<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_position_titles', function (Blueprint $table) {
            $table->id();
            $table->string('title_name', 100);
            $table->timestamps();
        });

        // Thêm các chức danh mẫu như SQL cung cấp
        DB::table('project_position_titles')->insert([
            ['title_name' => 'Chỉ huy trưởng', 'created_at' => now(), 'updated_at' => now()],
            ['title_name' => 'Chỉ huy phó', 'created_at' => now(), 'updated_at' => now()],
            ['title_name' => 'Giám sát kỹ thuật', 'created_at' => now(), 'updated_at' => now()],
            ['title_name' => 'Giám sát an toàn', 'created_at' => now(), 'updated_at' => now()],
            ['title_name' => 'Kế toán hiện trường', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('project_position_titles');
    }
};
