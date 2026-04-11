<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB; // Nhớ thêm dòng này ở đầu file


class ProjectController extends Controller
{
    /**
     * Lấy danh sách dự án
     */
    public function index()
    {
        // Lấy dự án kèm theo category và customer, sắp xếp mới nhất lên đầu
        $projects = Project::with(['category', 'customer'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($projects);
    }

    /**
     * Thêm hồ sơ mới
     */
    public function store(Request $request)
    {
        // Bật khiên bảo vệ Transaction: Lỗi 1 nhịp là hủy toàn bộ, không tạo ra hồ sơ "rỗng ruột"
        DB::beginTransaction();

        try {
            $categoryId = $request->category_id;

            // 1. TẠO HỒ SƠ (Dùng chính xác đoạn code siêu chuẩn của bạn)
            $id = DB::table('projects')->insertGetId([
                'project_code' => $request->project_code,
                'category_id' => $categoryId,
                'name' => $request->name,
                'customer_id' => $request->customer_id,
                'supervisor_id' => $request->supervisor_id ?? 1,
                'address' => $request->address,
                'start_date' => $request->start_date,
                'status' => $request->status ?? 'DRAFT',
                'priority' => $request->priority ?? 'MEDIUM',
                'created_at' => now(),
                'max_warehouse_capacity' => $request->max_warehouse_capacity ?? 0,
                'status_updated_at' => now(),
            ]);

            // 2. TỰ ĐỘNG HÓA: LẤY VÀ COPY QUY TRÌNH MẪU
            if ($categoryId) {
                // Quét xem Danh mục này có cấu hình sẵn công việc mẫu nào không
                $templates = DB::table('category_task_templates')
                    ->where('category_id', $categoryId)
                    ->get();

                if ($templates->isNotEmpty()) {
                    $tasksToInsert = [];

                    // Gom tất cả các đầu việc lại
                    foreach ($templates as $template) {
                        $tasksToInsert[] = [
                            'project_id' => $id, // Gắn vào ID của dự án vừa đẻ ra ở bước 1
                            'task_name' => $template->task_name,
                            'work_volume' => $template->work_volume,
                            'status' => 'TODO', // Mặc định là chưa làm
                            'sort_order' => $template->sort_order,
                            'created_at' => now(),
                        ];
                    }

                    // Bơm 1 phát toàn bộ danh sách công việc vào DB cho nhanh
                    DB::table('project_tasks')->insert($tasksToInsert);
                }
            }

            // 3. LOG LỊCH SỬ
            DB::table('project_histories')->insert([
                'project_id' => $id,
                'action' => 'Khởi tạo hồ sơ mới',
                'created_at' => now(),
            ]);

            DB::commit(); // Mọi thứ hoàn hảo, chốt lưu vào DB!

            // Lấy lại data để Frontend hiển thị thẻ Kanban mới
            $newProject = DB::table('projects')->where('id', $id)->first();

            return response()->json([
                'message' => 'Tạo hồ sơ và tự động thêm quy trình thành công!',
                'data' => $newProject
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack(); // Lỗi (do vướng khóa ngoại, thiếu trường...) thì lập tức "quay xe"
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Cập nhật hồ sơ (Dùng cho cả sửa thông tin và kéo thả)
     */

    public function update(Request $request, $id)
    {
        // Tìm dự án
        $project = \App\Models\Project::find($id);

        if (!$project) {
            return response()->json(['message' => 'Không tìm thấy'], 404);
        }

        $actions = [];
        if ($request->has('name') || $request->has('category_id') || $request->has('address')) {
            $actions[] = 'Cập nhật nội dung hồ sơ';
        }

        if ($request->has('status') && $project->status !== $request->status) {
            $project->status = $request->status;
            $project->status_updated_at = now();
            $actions[] = 'Thay đổi trạng thái sang "' . $request->status . '"';
        }

        // Cập nhật các trường nếu có
        if ($request->has('name'))
            $project->name = $request->name;
        if ($request->has('category_id'))
            $project->category_id = $request->category_id;
        if ($request->has('address'))
            $project->address = $request->address;

        // Lưu xuống Database
        $project->save();

        foreach ($actions as $action) {
            DB::table('project_histories')->insert([
                'project_id' => $project->id,
                'action' => $action,
                'created_at' => now()
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $project
        ]);
    }
    /**
     * Xóa hồ sơ
     */
    public function destroy($id)
    {
        $project = Project::find($id);
        if (!$project) {
            return response()->json(['message' => 'Không tìm thấy hồ sơ'], 404);
        }

        $project->delete();

        return response()->json(['message' => 'Đã xóa hồ sơ thành công']);
    }

    public function getCustomers()
    {
        try {
            $customers = DB::table('customers')->select('id', 'full_name as name')->get();
            return response()->json($customers);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Lấy chi tiết 1 hồ sơ kèm toàn bộ dữ liệu liên quan
     */
    public function show($id)
    {
        $project = Project::with([
            'category',
            'customer',
            'supervisor',
            'members.employee',
            'documents',
            'equipments.product',
            'histories',
            'tasks' => function ($q) {
                $q->orderBy('sort_order');
            },
        ])->find($id);

        if (!$project) {
            return response()->json(['message' => 'Không tìm thấy hồ sơ'], 404);
        }

        // Tính tiến độ dựa trên tasks
        $totalTasks = $project->tasks->count();
        $doneTasks = $project->tasks->where('status', 'DONE')->count();
        $progress = $totalTasks > 0 ? round(($doneTasks / $totalTasks) * 100) : 0;

        $data = $project->toArray();
        $data['progress'] = $progress;

        return response()->json(['data' => $data]);
    }

    /**
     * Thêm công việc (task) cho dự án
     */
    public function storeTask(Request $request, $projectId)
    {
        try {
            $id = DB::table('project_tasks')->insertGetId([
                'project_id' => $projectId,
                'task_name' => $request->task_name,
                'work_volume' => $request->work_volume ?? 0,
                'status' => 'TODO',
                'sort_order' => $request->sort_order ?? 0,
                'created_at' => now(),
            ]);

            $task = DB::table('project_tasks')->where('id', $id)->first();
            return response()->json(['data' => $task], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Cập nhật công việc (chỉnh sửa tên hoặc đổi trạng thái kéo thả)
     */
    public function updateTask(Request $request, $projectId, $taskId)
    {
        $task = DB::table('project_tasks')
            ->where('id', $taskId)
            ->where('project_id', $projectId)
            ->first();

        if (!$task) {
            return response()->json(['message' => 'Không tìm thấy công việc'], 404);
        }

        $updateData = [];
        if ($request->has('task_name'))
            $updateData['task_name'] = $request->task_name;
        if ($request->has('work_volume'))
            $updateData['work_volume'] = $request->work_volume;
        if ($request->has('sort_order'))
            $updateData['sort_order'] = $request->sort_order;

        if ($request->has('status')) {
            // Kiểm tra logic chỉ cho phép chuyển trạng thái tiến lên
            $statusOrder = ['TODO' => 1, 'DOING' => 2, 'DONE' => 3];
            $currentOrder = $statusOrder[$task->status] ?? 0;
            $newOrder = $statusOrder[$request->status] ?? 0;

            if ($newOrder < $currentOrder) {
                return response()->json(['message' => 'Không được kéo ngược trạng thái'], 422);
            }
            if ($newOrder > $currentOrder + 1) {
                return response()->json(['message' => 'Chỉ được chuyển sang trạng thái kế tiếp'], 422);
            }

            $updateData['status'] = $request->status;
            if ($request->status === 'DONE') {
                $updateData['completed_date'] = now();
            }
        }

        DB::table('project_tasks')
            ->where('id', $taskId)
            ->update($updateData);

        $updated = DB::table('project_tasks')->where('id', $taskId)->first();
        return response()->json(['data' => $updated]);
    }

    /**
     * Xóa công việc
     */
    public function destroyTask($projectId, $taskId)
    {
        $deleted = DB::table('project_tasks')
            ->where('id', $taskId)
            ->where('project_id', $projectId)
            ->delete();

        if (!$deleted) {
            return response()->json(['message' => 'Không tìm thấy công việc'], 404);
        }

        return response()->json(['message' => 'Đã xóa công việc']);
    }

    /**
     * Cập nhật trạng thái tài liệu (Duyệt / Từ chối)
     */
    public function updateDocument(Request $request, $projectId, $docId)
    {
        $doc = DB::table('project_documents')
            ->where('id', $docId)
            ->where('project_id', $projectId)
            ->first();

        if (!$doc) {
            return response()->json(['message' => 'Không tìm thấy tài liệu'], 404);
        }

        $updateData = [];
        if ($request->has('status'))
            $updateData['status'] = $request->status;
        if ($request->has('note'))
            $updateData['note'] = $request->note;

        DB::table('project_documents')
            ->where('id', $docId)
            ->update($updateData);

        $updated = DB::table('project_documents')->where('id', $docId)->first();
        return response()->json(['data' => $updated]);
    }

    /**
     * Thêm thành viên vào dự án
     */
    public function addMember(Request $request, $projectId)
    {
        try {
            $id = DB::table('project_members')->insertGetId([
                'project_id' => $projectId,
                'employee_id' => $request->employee_id,
            ]);

            $member = DB::table('project_members')
                ->join('employees', 'project_members.employee_id', '=', 'employees.id')
                ->where('project_members.id', $id)
                ->select('project_members.*', 'employees.full_name', 'employees.email', 'employees.job_title', 'employees.phone', 'employees.avatar', 'employees.status')
                ->first();

            return response()->json(['data' => $member], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Xóa thành viên khỏi dự án
     */
    public function removeMember($projectId, $memberId)
    {
        $deleted = DB::table('project_members')
            ->where('id', $memberId)
            ->where('project_id', $projectId)
            ->delete();

        if (!$deleted) {
            return response()->json(['message' => 'Không tìm thấy thành viên'], 404);
        }

        return response()->json(['message' => 'Đã xóa thành viên']);
    }

    /**
     * Lấy danh sách nhân viên (để chọn thêm vào dự án)
     */
    public function getEmployees()
    {
        $employees = DB::table('employees')
            ->where('status', 'WORKING')
            ->select('id', 'full_name', 'email', 'job_title', 'phone')
            ->get();

        return response()->json($employees);
    }
}

