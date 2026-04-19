<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('construction_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->date('log_date');
            $table->string('title', 255)->nullable();
            $table->text('description')->nullable();
            $table->string('weather', 50)->nullable();
            $table->string('created_by', 100)->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->index(['project_id', 'log_date']);
        });

        Schema::create('construction_log_images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('construction_log_id');
            $table->string('image_url', 500);
            $table->string('caption', 255)->nullable();
            $table->timestamp('taken_at')->nullable();
            $table->timestamps();

            $table->foreign('construction_log_id')->references('id')->on('construction_logs')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('construction_log_images');
        Schema::dropIfExists('construction_logs');
    }
};
