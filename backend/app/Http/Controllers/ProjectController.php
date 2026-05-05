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
            $project = Project::create([
                'project_code' => $projectCode,
                'category_id' => $categoryId,
                'name' => $request->name,
                'customer_id' => $request->customer_id,
                'supervisor_id' => $supervisorId,
                'address' => $request->address,
                'start_date' => $request->start_date,
                'status' => $request->status ?? 'DRAFT',
                'priority' => $request->priority ?? 'MEDIUM',
                'max_warehouse_capacity' => $request->max_warehouse_capacity ?? 0,
                'estimated_budget' => $request->estimated_budget ?? 0,
                'contract_value' => $request->contract_value ?? 0,
                'expected_end_date' => $request->expected_end_date,
                'status_updated_at' => now(),
            ]);

            $id = $project->id;

            // 4. TỰ ĐỘNG HÓA: COPY QUY TRÌNH MẪU
            if ($categoryId) {
                $templates = DB::table('category_task_templates')
                    ->where('category_id', $categoryId)
                    ->orderBy('sort_order', 'asc')
                    ->get();
                
                if ($templates->isNotEmpty()) {
                    foreach ($templates as $template) {
                        \App\Models\ProjectTask::create([
                            'project_id'    => $id,
                            'task_name'     => $template->task_name,
                            'work_volume'   => $template->work_volume,
                            'status'        => 'TODO',
                            'sort_order'    => $template->sort_order,
                            'estimated_finish_date' => now()->addDay()->toDateString(),
                        ]);
                    }
                }

                // TỰ ĐỘNG HÓA: COPY TÀI LIỆU MẪU (Link từ category_document_templates)
                $docTemplates = DB::table('category_document_templates')
                    ->where('category_id', $categoryId)
                    ->orderBy('sort_order', 'asc')
                    ->get();
                
                if ($docTemplates->isNotEmpty()) {
                    $docsToInsert = [];
                    foreach ($docTemplates as $docTemplate) {
                        $docsToInsert[] = [
                            'project_id'       => $id,
                            'document_name'    => $docTemplate->document_name ?? 'Tài liệu',
                            'document_type_id' => $docTemplate->document_type_id ?? null,
                            'status'           => 'PENDING',
                            'note'             => $docTemplate->is_required ? 'Tài liệu bắt buộc' : 'Tài liệu tùy chọn',
                            'uploaded_at'      => now(),
                            'file_url'         => null,
                            'estimated_finish_date' => now()->addDay()->toDateString(),
                        ];
                    }
                    DB::table('project_documents')->insert($docsToInsert);
                }
            }

            // Lấy tên người thực hiện
            $userId = request()->header('X-User-ID') ?? auth()->id();
            $actorName = 'Hệ thống tự động';
            if ($userId) {
                $user = \App\Models\User::find($userId);
                if ($user) {
                    $actorName = $user->full_name ?? $user->username;
                }
            }

            // 5. LOG LỊCH SỬ
            DB::table('project_histories')->insert([
                'project_id' => $id,
                'actor' => $actorName,
                'action' => 'Khởi tạo hồ sơ mới',
                'created_at' => now(),
            ]);

            DB::commit();

            // Trả về dữ liệu đầy đủ kèm quan hệ để Frontend hiển thị đúng (category name...)
            $newProject = Project::with(['category', 'customer'])->find($id);

            return response()->json([
                'status' => 'success',
                'data' => $newProject
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Error in ProjectController@store: " . $e->getMessage());
            return response()->json(['error' => 'Lỗi tạo hồ sơ: ' . $e->getMessage()], 500);
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

                // KHÔI PHỤC LẠI TASKS THEO DANH MỤC MỚI
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
                            'estimated_finish_date' => now()->addDay()->toDateString(),
                            'created_at'    => now(),
                        ];
                    }
                    DB::table('project_tasks')->insert($tasksToInsert);
                }
            }

            // Đồng bộ: Đổi hồ sơ cũng nên đổi lại tài liệu nếu chưa up tài liệu nào
            $uploadedDocs = DB::table('project_documents')
                ->where('project_id', $project->id)
                ->whereNotNull('file_url')
                ->count();
                
            if ($uploadedDocs === 0) {
                // Xóa tài liệu pending cũ
                DB::table('project_documents')->where('project_id', $project->id)->delete();
                
                $docTemplates = DB::table('category_document_templates')
                    ->where('category_id', $request->category_id)
                    ->orderBy('sort_order', 'asc')
                    ->get();
                
                if ($docTemplates->isNotEmpty()) {
                    $docsToInsert = [];
                    foreach ($docTemplates as $docTemplate) {
                        $docsToInsert[] = [
                            'project_id'       => $project->id,
                            'document_name'    => $docTemplate->document_name ?? 'Tài liệu',
                            'document_type_id' => $docTemplate->document_type_id ?? null,
                            'status'           => 'PENDING',
                            'note'             => $docTemplate->is_required ? 'Tài liệu bắt buộc' : 'Tài liệu tùy chọn',
                            'uploaded_at'      => now(),
                            'file_url'         => null,
                            'estimated_finish_date' => now()->addDay()->toDateString(),
                        ];
                    }
                    DB::table('project_documents')->insert($docsToInsert);
                }
            }

            $project->category_id = $request->category_id;
        }

        // Lưu xuống Database
        $project->save();

        // Lấy tên người thực hiện
        $userId = request()->header('X-User-ID') ?? auth()->id();
        $actorName = 'Quản trị viên';
        if ($userId) {
            $user = \App\Models\User::find($userId);
            if ($user) {
                $actorName = $user->full_name ?? $user->username;
            }
        }

        foreach ($actions as $action) {
            DB::table('project_histories')->insert([
                'project_id' => $project->id,
                'actor' => $actorName,
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
                $q->with('documentType')->orderBy('uploaded_at', 'desc');
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

        // SELF-HEALING TASKS: Nếu hồ sơ trống quy trình nhưng danh mục có quy trình mẫu -> Tự động copy
        if ($project->tasks->isEmpty() && $project->category_id) {
            $templates = DB::table('category_task_templates')
                ->where('category_id', $project->category_id)
                ->orderBy('sort_order', 'asc')
                ->get();

            if ($templates->isNotEmpty()) {
                $tasksToInsert = [];
                $cumulativeDays = 0;
                
                foreach ($templates as $template) {
                    // Cộng dồn số ngày từ các task trước
                    if ($template->estimated_completion_date && $template->estimated_completion_date > 0) {
                        $cumulativeDays += $template->estimated_completion_date;
                    }
                    
                    $tasksToInsert[] = [
                        'project_id'    => $id,
                        'task_name'     => $template->task_name,
                        'work_volume'   => $template->work_volume,
                        'status'        => 'TODO',
                        'sort_order'    => $template->sort_order,
                        'estimated_completion_date' => $cumulativeDays > 0 ? $cumulativeDays : null,
                        'estimated_finish_date' => now()->addDays($cumulativeDays > 0 ? $cumulativeDays : 1)->toDateString(),
                        'created_at'    => now(),
                    ];
                }
                DB::table('project_tasks')->insert($tasksToInsert);
                // Load lại tasks sau khi copy để trả về cho UI
                $project->load(['tasks' => function($q) { $q->orderBy('sort_order'); }]);
            }
        }

        // SELF-HEALING DOCUMENTS: Nếu hồ sơ chưa có tài liệu nào, tự động nạp từ mẫu
        if ($project->documents->isEmpty() && $project->category_id) {
            $docTemplates = DB::table('category_document_templates')
                ->where('category_id', $project->category_id)
                ->orderBy('sort_order', 'asc')
                ->get();

            if ($docTemplates->isNotEmpty()) {
                $docsToInsert = [];
                foreach ($docTemplates as $docTemplate) {
                    $docsToInsert[] = [
                        'project_id'       => $id,
                        'document_name'    => $docTemplate->document_name ?? 'Tài liệu',
                        'document_type_id' => $docTemplate->document_type_id ?? null,
                        'status'           => 'PENDING',
                        'note'             => $docTemplate->is_required ? 'Tài liệu bắt buộc' : 'Tài liệu tùy chọn',
                        'uploaded_at'      => now(),
                        'file_url'         => null,
                        'estimated_finish_date' => now()->addDay()->toDateString(),
                    ];
                }
                DB::table('project_documents')->insert($docsToInsert);
                // Load lại documents sau khi copy rỗng
                $project->load(['documents' => function ($q) { $q->orderBy('uploaded_at', 'desc'); }]);
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
                'estimated_completion_date' => $request->estimated_completion_date ?? null,
                'estimated_finish_date' => $request->estimated_finish_date ?? now()->addDay()->toDateString(),
                'actual_finish_date' => $request->actual_finish_date ?? null,
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
        if ($request->has('estimated_completion_date'))
            $updateData['estimated_completion_date'] = $request->estimated_completion_date ?: null;
        if ($request->has('estimated_finish_date'))
            $updateData['estimated_finish_date'] = $request->estimated_finish_date ?: null;
        if ($request->has('actual_finish_date'))
            $updateData['actual_finish_date'] = $request->actual_finish_date ?: null;

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
                $updateData['actual_finish_date'] = now()->toDateString();
            }
        }

        $taskModel = \App\Models\ProjectTask::where('id', $taskId)
            ->where('project_id', $projectId)
            ->first();

        if ($taskModel) {
            $taskModel->update($updateData);
        }

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
        $doc = \App\Models\ProjectDocument::where('id', $docId)
            ->where('project_id', $projectId)
            ->first();

        if (!$doc) {
            return response()->json(['message' => 'Không tìm thấy tài liệu'], 404);
        }

        if ($request->has('status')) {
            $doc->status = $request->status;
            if (in_array($request->status, ['COMPLETED', 'done', 'Approved'])) { // Phù hợp với các label được dùng
                $doc->actual_finish_date = now()->toDateString();
            }
        }
        if ($request->has('note')) $doc->note = $request->note;
        if ($request->has('estimated_finish_date')) $doc->estimated_finish_date = $request->estimated_finish_date;
        if ($request->has('actual_finish_date')) $doc->actual_finish_date = $request->actual_finish_date;

        $doc->save();

        return response()->json(['data' => $doc]);
    }

    /**
     * Thêm thành viên vào dự án
     */
    public function addMember(Request $request, $projectId)
    {
        try {
            $positionId = $request->project_position_id;
            
            if ($request->custom_position_name) {
                $pos = \App\Models\ProjectPositionTitle::firstOrCreate(
                    ['title_name' => trim($request->custom_position_name)]
                );
                $positionId = $pos->id;
            }

            $member = \App\Models\ProjectMember::create([
                'project_id' => $projectId,
                'employee_id' => $request->employee_id,
                'project_position_id' => $positionId,
            ]);

            // Load extra info for response format matching
            $fullMember = \App\Models\ProjectMember::with(['employee', 'position'])
                ->find($member->id);

            $response = [
                'id' => $fullMember->id,
                'project_id' => $fullMember->project_id,
                'employee_id' => $fullMember->employee_id,
                'project_position_id' => $fullMember->project_position_id,
                'full_name' => $fullMember->employee->full_name ?? '',
                'email' => $fullMember->employee->email ?? '',
                'job_title' => $fullMember->employee->job_title ?? '',
                'phone' => $fullMember->employee->phone ?? '',
                'avatar' => $fullMember->employee->avatar ?? '',
                'status' => $fullMember->employee->status ?? '',
                'title_name' => $fullMember->position->title_name ?? ''
            ];

            return response()->json(['data' => $response], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Xóa thành viên khỏi dự án
     */
    public function removeMember($projectId, $memberId)
    {
        $member = \App\Models\ProjectMember::where('id', $memberId)
            ->where('project_id', $projectId)
            ->first();

        if (!$member) {
            return response()->json(['message' => 'Không tìm thấy thành viên'], 404);
        }

        $member->delete();
        return response()->json(['message' => 'Đã xóa thành viên']);
    }

    /**
     * Lấy danh sách nhân viên (để chọn thêm vào dự án)
     */
    public function getEmployees()
    {
        $employees = \App\Models\Employee::with(['user.role'])
            ->where('status', 'WORKING')
            ->get()
            ->map(function($emp) {
                return [
                    'id' => $emp->id,
                    'user_id' => $emp->user_id, // Quan trọng để map sang workflow_project_approvers
                    'full_name' => $emp->full_name,
                    'email' => $emp->email ?? ($emp->user ? $emp->user->email : ''),
                    'phone' => $emp->phone ?? ($emp->user ? $emp->user->phone : ''),
                    'role_id' => $emp->user ? $emp->user->role_id : null, // Quan trọng để tự động chọn loại tài liệu
                    'role_name' => $emp->user && $emp->user->role ? $emp->user->role->name : '',
                    'role_color' => $emp->user && $emp->user->role ? $emp->user->role->color : ''
                ];
            });

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
            'document_id' => 'nullable|integer'
        ]);

        try {
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = public_path('uploads/documents');
            if (!file_exists($path)) {
                mkdir($path, 0777, true);
            }
            $file->move($path, $filename);

            $fileUrl = url('uploads/documents/' . $filename);

            $targetDoc = null;
            if ($request->filled('document_id')) {
                // TRƯỜNG HỢP: Khách hàng nộp file vào slot (Pending) đã có sẵn
                $targetDoc = \App\Models\ProjectDocument::where('id', $request->document_id)
                    ->where('project_id', $projectId)
                    ->first();
                
                if ($targetDoc) {
                    $targetDoc->update([
                        'file_url'      => $fileUrl,
                        'uploaded_at'   => now(),
                        'status'        => 'PENDING',
                        'note'          => 'Khách hàng đã nộp tài liệu theo yêu cầu.'
                    ]);
                }
            } else {
                // TRƯỜNG HỢP: Khách hàng tự upload thêm tài liệu mới ngoài mẫu
                // Mặc định gán vào "Tài liệu khác" (ID 30007) hoặc lấy từ request nếu có
                $docTypeId = $request->document_type_id ?? 30007;

                $targetDoc = \App\Models\ProjectDocument::create([
                    'project_id'    => $projectId,
                    'document_name' => $request->name,
                    'document_type_id' => $docTypeId,
                    'file_url'      => $fileUrl,
                    'uploaded_at'   => now(),
                    'status'        => 'PENDING',
                    'note'          => 'Tài liệu do khách hàng cung cấp'
                ]);
            }

            // --- KHỞI TẠO QUY TRÌNH NẾU CHƯA CÓ ---
            if ($targetDoc && !$targetDoc->current_step_id) {
                $docType = DB::table('document_types')->where('id', $targetDoc->document_type_id)->first();
                if ($docType && $docType->assigned_workflow_id) {
                    $firstStep = DB::table('workflow_steps')
                        ->where('workflow_id', $docType->assigned_workflow_id)
                        ->orderBy('sort_order', 'asc')
                        ->first();
                    
                    if ($firstStep) {
                        $targetDoc->update(['current_step_id' => $firstStep->id]);
                        
                        // Ghi log SUBMIT
                        DB::table('document_workflow_logs')->insert([
                            'document_id' => $targetDoc->id,
                            'step_id'     => $firstStep->id,
                            'processor_id' => 1, // Mặc định từ khách hàng -> Admin ghi nhận
                            'action'      => 'SUBMIT',
                            'comment'     => 'Khách hàng nộp hồ sơ',
                            'created_at'  => now()
                        ]);
                    }
                }
            }

            return response()->json([
                'status' => 'success',
                'data' => $targetDoc
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}

