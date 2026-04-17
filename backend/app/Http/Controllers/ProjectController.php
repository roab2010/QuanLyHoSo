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

    public function getByCustomer($customerId)
    {
        $projects = Project::with([
                'category', 
                'documents' => function($q) {
                    $q->orderBy('uploaded_at', 'desc');
                },
                'tasks' => function($q) {
                    $q->orderBy('id', 'asc');
                },
                'members.employee',
                'supervisor'
            ])
            ->where('customer_id', $customerId)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($projects);
    }

    /**
     * Thêm hồ sơ mới
     */
    public function store(Request $request)
    {
        // 1. VALIDATION: Bắt buộc tất cả các trường quan trọng
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category_id' => 'required',
            'customer_id' => 'required',
            'start_date' => 'required|date',
            'address' => 'required|string',
            'priority' => 'required|string',
            'max_warehouse_capacity' => 'required|numeric',
            'estimated_budget' => 'nullable|numeric',
            'contract_value' => 'nullable|numeric',
            'expected_end_date' => 'nullable|date',
        ], [
            'required' => ':attribute không được để trống.',
            'date' => ':attribute không đúng định dạng ngày.',
            'numeric' => ':attribute phải là con số.',
        ], [
            'name' => 'Tên hồ sơ',
            'category_id' => 'Loại dự án',
            'customer_id' => 'Khách hàng',
            'start_date' => 'Ngày bắt đầu',
            'address' => 'Địa chỉ',
            'priority' => 'Độ ưu tiên',
            'max_warehouse_capacity' => 'Công suất kho',
            'estimated_budget' => 'Chi phí dự kiến',
            'contract_value' => 'Giá trị hợp đồng',
            'expected_end_date' => 'Ngày hoàn thành dự kiến',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        // Bật khiên bảo vệ Transaction
        DB::beginTransaction();

        try {
            $categoryId = $request->category_id;

            // 2. TỰ ĐỘNG TẠO MÃ HỒ SƠ (HS001, HS002...)
            $latestProject = DB::table('projects')->orderBy('id', 'desc')->first();
            $nextNumber = 1;
            if ($latestProject && preg_match('/HS(\d+)/', $latestProject->project_code, $matches)) {
                $nextNumber = intval($matches[1]) + 1;
            }
            $projectCode = 'HS' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

            // Đảm bảo supervisor_id tồn tại để không dính lỗi foreign key
            $supervisorId = $request->supervisor_id ?? 1;
            if (!DB::table('employees')->where('id', $supervisorId)->exists()) {
                $supervisorId = DB::table('employees')->insertGetId([
                    'employee_code' => 'EMP-' . time(),
                    'full_name' => 'Người quản lý hệ thống',
                    'created_at' => now(),
                    'status' => 'WORKING'
                ]);
            }

            // 3. TẠO HỒ SƠ
            $id = DB::table('projects')->insertGetId([
                'project_code' => $projectCode, // Sử dụng mã tự sinh
                'category_id' => $categoryId,
                'name' => $request->name,
                'customer_id' => $request->customer_id,
                'supervisor_id' => $supervisorId,
                'address' => $request->address,
                'start_date' => $request->start_date,
                'status' => $request->status ?? 'DRAFT',
                'priority' => $request->priority ?? 'MEDIUM',
                'created_at' => now(),
                'max_warehouse_capacity' => $request->max_warehouse_capacity ?? 0,
                'estimated_budget' => $request->estimated_budget ?? 0,
                'contract_value' => $request->contract_value ?? 0,
                'expected_end_date' => $request->expected_end_date,
                'status_updated_at' => now(),
            ]);

            // 4. TỰ ĐỘNG HÓA: COPY QUY TRÌNH MẪU
            if ($categoryId) {
                $templates = DB::table('category_task_templates')
                    ->where('category_id', $categoryId)
                    ->orderBy('sort_order', 'asc')
                    ->get();
                
                if ($templates->isNotEmpty()) {
                    $tasksToInsert = [];
                    foreach ($templates as $template) {
                        $tasksToInsert[] = [
                            'project_id'    => $id,
                            'task_name'     => $template->task_name,
                            'work_volume'   => $template->work_volume,
                            'status'        => 'TODO',
                            'sort_order'    => $template->sort_order,
                            'created_at'    => now(),
                        ];
                    }
                    DB::table('project_tasks')->insert($tasksToInsert);
                }
            }

            // 5. LOG LỊCH SỬ
            DB::table('project_histories')->insert([
                'project_id' => $id,
                'action' => 'Khởi tạo hồ sơ mới',
                'created_at' => now(),
            ]);

            DB::commit();

            $newProject = DB::table('projects')->where('id', $id)->first();

            return response()->json([
                'message' => 'Tạo hồ sơ thành công!',
                'data' => $newProject
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Lỗi tạo hồ sơ: ' . $e->getMessage());
            return response()->json(['error' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
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
        if ($request->has('name')) {
            $project->name = $request->name;
        }
        
        if ($request->has('address')) {
            $project->address = $request->address ?? '';
        }

        if ($request->has('estimated_budget')) {
            $project->estimated_budget = $request->estimated_budget;
        }

        if ($request->has('contract_value')) {
            $project->contract_value = $request->contract_value;
        }

        if ($request->has('start_date')) {
            $project->start_date = $request->start_date;
        }

        if ($request->has('max_warehouse_capacity')) {
            $project->max_warehouse_capacity = $request->max_warehouse_capacity;
        }
        
        if ($request->has('expected_end_date')) {
            $project->expected_end_date = $request->expected_end_date;
        }

        // 4. THÔNG MINH HÓA: Nếu đổi danh mục, tự động nạp quy trình mới
        if ($request->has('category_id') && $request->category_id != $project->getOriginal('category_id')) {
            // Kiểm tra xem có công việc nào đã bắt đầu làm (PROCESSING/DONE) chưa
            $startedTasks = DB::table('project_tasks')
                ->where('project_id', $project->id)
                ->where('status', '!=', 'TODO')
                ->count();

            // Nếu CHƯA CÓ CÔNG VIỆC NÀO BẮT ĐẦU (hoặc hồ sơ trống), ta được phép nạp lại quy trình mới
            if ($startedTasks === 0) {
                // Xóa các công việc TODO cũ (nếu có) để tránh bị rác dữ liệu
                DB::table('project_tasks')->where('project_id', $project->id)->delete();

                $templates = DB::table('category_task_templates')
                    ->where('category_id', $request->category_id)
                    ->orderBy('sort_order', 'asc')
                    ->get();
                
                if ($templates->isNotEmpty()) {
                    $tasksToInsert = [];
                    foreach ($templates as $template) {
                        $tasksToInsert[] = [
                            'project_id'    => $project->id,
                            'task_name'     => $template->task_name,
                            'work_volume'   => $template->work_volume,
                            'status'        => 'TODO',
                            'sort_order'    => $template->sort_order,
                            'created_at'    => now(),
                        ];
                    }
                    DB::table('project_tasks')->insert($tasksToInsert);
                }
            }
            $project->category_id = $request->category_id;
        }

        // Lưu xuống Database
        $project->save();

        foreach ($actions as $action) {
            DB::table('project_histories')->insert([
                'project_id' => $project->id,
                'actor' => 'Nguyễn Văn A',
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

        try {
            // Xóa các bảng liên quan trước
            DB::table('project_tasks')->where('project_id', $id)->delete();
            DB::table('project_members')->where('project_id', $id)->delete();
            DB::table('project_documents')->where('project_id', $id)->delete();
            DB::table('project_equipments')->where('project_id', $id)->delete();
            DB::table('project_histories')->where('project_id', $id)->delete();

            $project->delete();

            return response()->json(['message' => 'Đã xóa hồ sơ thành công']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi khi xóa: ' . $e->getMessage()], 500);
        }
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
            'tasks' => function ($q) {
                $q->orderBy('sort_order');
            },
            'documents' => function ($q) {
                $q->orderBy('uploaded_at', 'desc');
            },
            'members.employee',
            'members.projectPositionTitle',
            'histories' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
            'equipments.product',
        ])->find($id);

        if (!$project) {
            return response()->json(['message' => 'Hồ sơ không tồn tại'], 404);
        }

        // SELF-HEALING: Nếu hồ sơ trống quy trình nhưng danh mục có quy trình mẫu -> Tự động copy
        if ($project->tasks->isEmpty() && $project->category_id) {
            $templates = DB::table('category_task_templates')
                ->where('category_id', $project->category_id)
                ->orderBy('sort_order', 'asc')
                ->get();

            if ($templates->isNotEmpty()) {
                $tasksToInsert = [];
                foreach ($templates as $template) {
                    $tasksToInsert[] = [
                        'project_id'    => $id,
                        'task_name'     => $template->task_name,
                        'work_volume'   => $template->work_volume,
                        'status'        => 'TODO',
                        'sort_order'    => $template->sort_order,
                        'created_at'    => now(),
                    ];
                }
                DB::table('project_tasks')->insert($tasksToInsert);
                // Load lại tasks sau khi copy để trả về cho UI
                $project->load(['tasks' => function($q) { $q->orderBy('sort_order'); }]);
            }
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
                'project_position_id' => $request->project_position_id ?? null,
            ]);

            $member = DB::table('project_members')
                ->join('employees', 'project_members.employee_id', '=', 'employees.id')
                ->leftJoin('project_position_titles', 'project_members.project_position_id', '=', 'project_position_titles.id')
                ->where('project_members.id', $id)
                ->select(
                    'project_members.*', 
                    'employees.full_name', 
                    'employees.email', 
                    'employees.job_title', 
                    'employees.phone', 
                    'employees.avatar', 
                    'employees.status',
                    'project_position_titles.title_name'
                )
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
            ->leftJoin('users', 'employees.user_id', '=', 'users.id')
            ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
            ->where('employees.status', 'WORKING')
            ->select(
                'employees.id', 
                'employees.full_name', 
                \DB::raw('IFNULL(employees.email, users.email) as email'), 
                \DB::raw('IFNULL(employees.phone, users.phone) as phone'),
                'roles.name as role_name', 
                'roles.color as role_color'
            )
            ->get();

        return response()->json($employees);
    }

    /**
     * Lấy danh sách chức danh dự án
     */
    public function getProjectPositions()
    {
        $positions = \App\Models\ProjectPositionTitle::orderBy('id', 'asc')->get();
        return response()->json($positions);
    }
    /**
     * Khách hàng tự upload tài liệu/ảnh lên hồ sơ
     */
    public function customerUploadDocument(Request $request, $projectId)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB limit
            'name' => 'required|string|max:255',
        ]);

        try {
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = public_path('uploads/documents');
            if (!file_exists($path)) {
                mkdir($path, 0777, true);
            }
            $file->move($path, $filename);

            $docId = DB::table('project_documents')->insertGetId([
                'project_id'    => $projectId,
                'document_name' => $request->name,
                'file_url'      => url('uploads/documents/' . $filename),
                'uploaded_at'   => now(),
                'status'        => 'PENDING',
                'category_name' => 'Khách hàng gửi',
                'note'          => 'Tài liệu do khách hàng cung cấp'
            ]);

            $doc = DB::table('project_documents')->where('id', $docId)->first();

            return response()->json([
                'status' => 'success',
                'data' => $doc
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}

