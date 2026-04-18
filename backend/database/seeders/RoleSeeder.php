<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    /**
     * Seed các chức vụ mặc định cho công ty xây dựng
     * Hệ thống quản lý hồ sơ - DocuVault
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'admin',
                'color' => '#ef4444',
                'level' => 1,
                'status' => 1,
                'permissions' => json_encode([
                    // Admin có toàn quyền - được hardcode trong frontend
                    // Danh sách dưới đây chỉ để tham chiếu
                    'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
                    'categories.view', 'categories.manage', 'categories.delete',
                    'documents.view', 'documents.upload', 'documents.edit', 'documents.delete',
                    'inventory.view', 'inventory.manage', 'inventory.delete',
                    'suppliers.view', 'suppliers.manage', 'suppliers.delete',
                    'hr.view', 'hr.manage', 'hr.roles', 'hr.delete',
                    'customers.view', 'customers.manage',
                    'kanban.drag',
                    'tasks.manage', 'tasks.delete',
                    'members.manage',
                    'system_log.view',
                ]),
            ],
            [
                'name' => 'Phó Giám đốc',
                'color' => '#f59e0b',
                'level' => 2,
                'status' => 1,
                'permissions' => json_encode([
                    'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
                    'categories.view', 'categories.manage', 'categories.delete',
                    'documents.view', 'documents.upload', 'documents.edit', 'documents.delete',
                    'inventory.view', 'inventory.manage', 'inventory.delete',
                    'suppliers.view', 'suppliers.manage', 'suppliers.delete',
                    'hr.view', 'hr.manage',
                    'customers.view', 'customers.manage',
                    'kanban.drag',
                    'tasks.manage', 'tasks.delete',
                    'members.manage',
                ]),
            ],
            [
                'name' => 'Trưởng phòng',
                'color' => '#2563eb',
                'level' => 3,
                'status' => 1,
                'permissions' => json_encode([
                    'projects.view', 'projects.create', 'projects.edit',
                    'categories.view', 'categories.manage',
                    'documents.view', 'documents.upload', 'documents.edit', 'documents.delete',
                    'inventory.view', 'inventory.manage',
                    'suppliers.view', 'suppliers.manage',
                    'hr.view',
                    'customers.view', 'customers.manage',
                    'kanban.drag',
                    'tasks.manage', 'tasks.delete',
                    'members.manage',
                ]),
            ],
            [
                'name' => 'Kỹ sư công trường',
                'color' => '#10b981',
                'level' => 4,
                'status' => 1,
                'permissions' => json_encode([
                    'projects.view', 'projects.edit',
                    'categories.view',
                    'documents.view', 'documents.upload', 'documents.edit',
                    'inventory.view',
                    'suppliers.view',
                    'kanban.drag',
                    'tasks.manage',
                    'members.manage',
                ]),
            ],
            [
                'name' => 'Kế toán',
                'color' => '#8b5cf6',
                'level' => 4,
                'status' => 1,
                'permissions' => json_encode([
                    'projects.view',
                    'categories.view',
                    'documents.view', 'documents.upload',
                    'inventory.view', 'inventory.manage',
                    'suppliers.view', 'suppliers.manage',
                    'customers.view', 'customers.manage',
                ]),
            ],
            [
                'name' => 'Nhân viên',
                'color' => '#64748b',
                'level' => 5,
                'status' => 1,
                'permissions' => json_encode([
                    'projects.view',
                    'categories.view',
                    'documents.view',
                    'inventory.view',
                    'suppliers.view',
                    'customers.view',
                ]),
            ],
        ];

        foreach ($roles as $role) {
            $existing = DB::table('roles')->where('name', $role['name'])->first();
            if ($existing) {
                DB::table('roles')->where('id', $existing->id)->update([
                    'color' => $role['color'],
                    'level' => $role['level'],
                    'permissions' => $role['permissions'],
                ]);
            } else {
                DB::table('roles')->insert($role);
            }
        }
    }
}
