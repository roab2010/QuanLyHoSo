<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Exception;

class EmployeeController extends Controller
{
    /**
     * Lấy danh sách nhân viên để hiển thị trong mục "Quản lý nhân viên"
     */
    public function index()
    {
        $employees = DB::table('employees')
            ->leftJoin('users', 'employees.user_id', '=', 'users.id')
            ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
            ->select(
                'employees.id',
                'employees.employee_code',
                'employees.full_name',
                'employees.status',
                'employees.user_id',
                \DB::raw('IFNULL(employees.email, users.email) as email'),
                \DB::raw('IFNULL(employees.phone, users.phone) as phone'),
                'users.username',
                'users.status as user_status',
                'roles.name as role_name',
                'roles.id as role_id',
                'roles.color as role_color',
                'users.image as image'
            )
            ->orderBy('employees.id', 'desc')
            ->get();

        return response()->json($employees);
    }

    /**
     * Lấy các dự án mà nhân viên đang tham gia
     */
    public function getEmployeeProjects($id)
    {
        // Xét dự án nhân viên tham gia thông qua project_members
        $memberProjects = DB::table('project_members')
            ->join('projects', 'project_members.project_id', '=', 'projects.id')
            ->leftJoin('project_position_titles', 'project_members.project_position_id', '=', 'project_position_titles.id')
            ->where('project_members.employee_id', $id)
            ->select(
                'projects.id',
                'projects.project_code',
                'projects.name as project_name',
                'projects.status',
                \DB::raw("IFNULL(project_position_titles.title_name, 'Thành viên') as position_in_project")
            )
            ->get();

        // Xét dự án nhân viên tham gia dưới vai trò chỉ huy trưởng (supervisor_id)
        $supervisorProjects = DB::table('projects')
            ->where('supervisor_id', $id)
            ->select(
                'projects.id',
                'projects.project_code',
                'projects.name as project_name',
                'projects.status',
                \DB::raw("'Chỉ huy trưởng' as position_in_project")
            )
            ->get();

        // Gộp hai danh sách lại và loại bỏ cái trùng (dựa vào id dự án)
        $mergedProjects = collect($memberProjects)->merge($supervisorProjects)->unique('id')->values()->all();

        return response()->json($mergedProjects);
    }

    /**
     * Lấy danh sách Roles để đổ vào form thêm nhân sự
     */
    public function getRoles()
    {
        $roles = DB::table('roles')->get();
        return response()->json($roles);
    }

    /**
     * Xóa nhân viên và tài khoản liên quan
     */
    public function destroy($id)
    {
        $employee = \DB::table('employees')->where('id', $id)->first();
        if (!$employee) {
            return response()->json(['message' => 'Không tìm thấy nhân viên'], 404);
        }

        \DB::beginTransaction();
        try {
            // Xóa User associated with this employee if exists
            if ($employee->user_id) {
                \DB::table('users')->where('id', $employee->user_id)->delete();
            }
            // Xóa Employee
            \DB::table('employees')->where('id', $id)->delete();

            \DB::commit();
            return response()->json(['message' => 'Xóa nhân viên thành công']);
        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json(['message' => 'Lỗi khi xóa nhân viên: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Thêm nhân sự mới (Cấp phát tài khoản)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:100',
            'email' => 'required|email|max:100|unique:employees,email',
            'phone' => 'nullable|string|max:20',
            'role_id' => 'required|exists:roles,id',
        ], [
            'required' => ':attribute không được để trống.',
            'email.unique' => 'Email này đã tồn tại trong hệ thống.',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        DB::beginTransaction();

        try {
            // 1. Tự sinh username (từ email)
            $emailParts = explode('@', $request->email);
            $baseUsername = $emailParts[0] ?? strtolower(str_replace(' ', '', $request->full_name));
            $username = $baseUsername;

            // Đảm bảo username là duy nhất
            $counter = 1;
            while (DB::table('users')->where('username', $username)->exists()) {
                $username = $baseUsername . $counter;
                $counter++;
            }

            // 2. Tạo User (Mật khẩu mặc định là 123456)
            $userId = DB::table('users')->insertGetId([
                'username' => $username,
                'full_name' => $request->full_name,
                'email' => $request->email,
                'phone' => $request->phone ?? '',
                'password_hash' => Hash::make('123456'),
                'role_id' => $request->role_id,
                'status' => 1,
            ]);

            // 3. Tự sinh mã nhân viên (NV001, NV002...)
            $latestEmployee = DB::table('employees')->orderBy('id', 'desc')->first();
            $nextNumber = 1;
            if ($latestEmployee && preg_match('/NV(\d+)/', $latestEmployee->employee_code, $matches)) {
                $nextNumber = intval($matches[1]) + 1;
            }
            $employeeCode = 'NV' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

            // 4. Tạo Employee
            $employeeId = DB::table('employees')->insertGetId([
                'user_id' => $userId,
                'employee_code' => $employeeCode,
                'full_name' => $request->full_name,
                'email' => $request->email,
                'phone' => $request->phone ?? '',
                'status' => 'WORKING',
                'created_at' => now()
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Tạo nhân viên thành công!',
                'data' => [
                    'employee_code' => $employeeCode,
                    'full_name' => $request->full_name,
                    'username' => $username,
                    'email' => $request->email,
                ]
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cập nhật quyền (vai trò) của nhân sự
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'role_id' => 'required|exists:roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        DB::beginTransaction();
        try {
            $employee = DB::table('employees')->where('id', $id)->first();
            if (!$employee || !$employee->user_id) {
                return response()->json(['error' => 'Không tìm thấy tài khoản người dùng tương ứng.'], 404);
            }

            DB::table('users')
                ->where('id', $employee->user_id)
                ->update([
                    'role_id' => $request->role_id
                ]);

            DB::commit();
            return response()->json(['message' => 'Cập nhật phân quyền thành công'], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Tạo vai trò mới
     */
    public function storeRole(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50|unique:roles,name',
            'color' => 'required|string|max:20',
            'permissions' => 'nullable|array',
            'global_document_type_ids' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        DB::beginTransaction();
        try {
            $roleId = DB::table('roles')->insertGetId([
                'name' => $request->name,
                'color' => $request->color,
                'permissions' => json_encode($request->permissions),
                'level' => 3, // Mặc định là nhân viên
                'status' => 1,
            ]);

            $this->syncGlobalApprovers($roleId, $request->global_document_type_ids ?? [], $request->header('X-User-ID'));

            DB::commit();
            return response()->json(['message' => 'Tạo vai trò thành công', 'id' => $roleId], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cập nhật chức vụ
     */
    public function updateRole(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50',
            'color' => 'required|string|max:20',
            'permissions' => 'nullable|array',
            'global_document_type_ids' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        DB::beginTransaction();
        try {
            DB::table('roles')->where('id', $id)->update([
                'name' => $request->name,
                'color' => $request->color,
                'permissions' => json_encode($request->permissions),
            ]);

            $this->syncGlobalApprovers($id, $request->global_document_type_ids ?? [], $request->header('X-User-ID'));

            DB::commit();
            return response()->json(['message' => 'Cập nhật thành công'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }

    private function syncGlobalApprovers($roleId, $documentTypeIds, $adminUserId)
    {
        DB::table('workflow_project_approvers')
            ->where('scope_type', 'global')
            ->where('role_id', $roleId)
            ->delete();

        foreach ($documentTypeIds as $dtId) {
            $docType = DB::table('document_types')->where('id', $dtId)->first();
            if (!$docType || !$docType->assigned_workflow_id) continue;

            $matchingStep = DB::table('workflow_steps')
                ->where('workflow_id', $docType->assigned_workflow_id)
                ->where('role_id_assigned', $roleId)
                ->first();

            if (!$matchingStep) {
                $matchingStep = DB::table('workflow_steps')
                    ->where('workflow_id', $docType->assigned_workflow_id)
                    ->orderBy('sort_order', 'asc')
                    ->first();
            }

            if ($matchingStep) {
                DB::table('workflow_project_approvers')->insert([
                    'workflow_step_id' => $matchingStep->id,
                    'scope_type'       => 'global',
                    'scope_id'         => 0,
                    'role_id'          => $roleId,
                    'document_type_id' => $dtId,
                    'granted_by'       => $adminUserId,
                    'created_at'       => now(),
                ]);
            }
        }
    }

    /**
     * Xóa chức vụ
     */
    public function destroyRole($id)
    {
        try {
            $role = DB::table('roles')->where('id', $id)->first();
            if (!$role) {
                return response()->json(['error' => 'Không tìm thấy chức vụ'], 404);
            }

            if (strtolower($role->name) === 'admin') {
                return response()->json(['error' => 'Không thể xóa chức vụ quản trị (Admin)'], 403);
            }

            // check if being used
            $usersCount = DB::table('users')->where('role_id', $id)->count();
            if ($usersCount > 0) {
                return response()->json(['error' => 'Không thể xóa chức vụ đang được gắn cho ' . $usersCount . ' nhân viên'], 400);
            }

            DB::table('roles')->where('id', $id)->delete();

            return response()->json(['message' => 'Xóa chức vụ thành công'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }
}
