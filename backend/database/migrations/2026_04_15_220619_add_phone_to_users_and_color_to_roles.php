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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->string('color')->nullable()->default('#3b82f6')->after('name');
            $table->text('permissions')->nullable()->after('color');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('phone');
        });
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn(['color', 'permissions']);
        });
    }
};
