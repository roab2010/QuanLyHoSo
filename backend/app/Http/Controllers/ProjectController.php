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
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'project_code' => 'required|string|unique:projects,project_code',
            'status' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Dữ liệu không hợp lệ', 'errors' => $validator->errors()], 422);
        }

        // Tạo dự án mới
        $project = Project::create([
            'project_code'  => $request->project_code,
            'name'          => $request->name,
            'address'       => $request->address,
            'status'        => $request->status ?? 'DRAFT',
            'priority'      => $request->priority ?? 'MEDIUM',
            'start_date'    => $request->start_date ?? now()->format('Y-m-d'),
            'category_id'   => $request->category_id ?? 1, // Mặc định nếu chưa chọn
            'customer_id'   => $request->customer_id ?? 1,
        ]);

        return response()->json($project, 201);
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
}