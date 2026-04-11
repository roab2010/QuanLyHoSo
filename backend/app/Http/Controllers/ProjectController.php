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
                'project_code'           => $request->project_code,
                'category_id'            => $categoryId,
                'name'                   => $request->name,
                'customer_id'            => $request->customer_id,
                'supervisor_id'          => $request->supervisor_id ?? 1,
                'address'                => $request->address,
                'start_date'             => $request->start_date,
                'status'                 => $request->status ?? 'DRAFT',
                'priority'               => $request->priority ?? 'MEDIUM',
                'created_at'             => now(),
                'max_warehouse_capacity' => $request->max_warehouse_capacity ?? 0,
                'status_updated_at'      => now(),
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
                            'project_id'  => $id, // Gắn vào ID của dự án vừa đẻ ra ở bước 1
                            'task_name'   => $template->task_name,
                            'work_volume' => $template->work_volume,
                            'status'      => 'TODO', // Mặc định là chưa làm
                            'sort_order'  => $template->sort_order,
                            'created_at'  => now(),
                        ];
                    }

                    // Bơm 1 phát toàn bộ danh sách công việc vào DB cho nhanh
                    DB::table('project_tasks')->insert($tasksToInsert);
                }
            }

            DB::commit(); // Mọi thứ hoàn hảo, chốt lưu vào DB!

            // Lấy lại data để Frontend hiển thị thẻ Kanban mới
            $newProject = DB::table('projects')->where('id', $id)->first();

            return response()->json([
                'message' => 'Tạo hồ sơ và tự động thêm quy trình thành công!',
                'data'    => $newProject
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

        // Nhận giá trị từ React (ví dụ: 'PROCESSING')
        if ($request->has('status')) {
            // Gán trực tiếp vào cột status
            $project->status = $request->status;

            // Lưu xuống Database
            $project->save();

            return response()->json([
                'status' => 'success',
                'data' => $project
            ]);
        }

        return response()->json(['message' => 'Thiếu dữ liệu status'], 400);
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
            // Dùng DB table để lấy trực tiếp từ bảng customers
            $customers = DB::table('customers')->select('id', 'full_name as name')->get();
            // Lưu ý: Nếu cột tên là full_name (như trong ảnh bạn chụp), hãy dùng 'as name' để đồng bộ với React
            return response()->json($customers);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
