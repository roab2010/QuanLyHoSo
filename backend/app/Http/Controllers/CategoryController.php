<?php

namespace App\Http\Controllers;

use App\Models\ProjectCategory;
use App\Models\CategoryTaskTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    // 1. READ ALL: Lấy danh sách (Có kèm task mẫu)
    public function index()
    {
        $categories = ProjectCategory::orderBy('name', 'asc')->get();
        return response()->json($categories, 200);
    }

    // 2. READ ONE: Xem chi tiết 1 Danh mục
    public function show($id)
    {
        $category = ProjectCategory::with('tasks')->findOrFail($id);
        return response()->json($category, 200);
    }

    // 3. CREATE: Thêm mới Danh mục + Kèm Task
    public function store(Request $request)
    {
        $request->validate([
            'category_code' => 'required|unique:project_categories,category_code',
            'name' => 'required|string|max:150',
            'tasks' => 'nullable|array'
        ]);

        DB::beginTransaction();
        try {
            $category = ProjectCategory::create($request->only(['category_code', 'name', 'description', 'status']));

            if ($request->has('tasks')) {
                foreach ($request->tasks as $index => $taskData) {
                    CategoryTaskTemplate::create([
                        'category_id' => $category->id,
                        'task_name' => $taskData['task_name'],
                        'work_volume' => $taskData['work_volume'] ?? 0,
                        'sort_order' => $index + 1
                    ]);
                }
            }
            DB::commit();
            return response()->json(['message' => 'Tạo thành công!', 'data' => $category->load('tasks')], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
        }
    }

    // 4. UPDATE: Sửa thông tin Danh mục
    public function update(Request $request, $id)
    {
        $category = ProjectCategory::findOrFail($id);

        $request->validate([
            // Cho phép trùng code của chính nó, nhưng không trùng với thằng khác
            'category_code' => 'required|unique:project_categories,category_code,' . $id,
            'name' => 'required|string|max:150',
        ]);

        $category->update($request->only(['category_code', 'name', 'description', 'status']));

        return response()->json([
            'message' => 'Cập nhật danh mục thành công!',
            'data' => $category
        ], 200);
    }

    // 5. DELETE: Xóa Danh mục
    public function destroy($id)
    {
        $category = ProjectCategory::findOrFail($id);

        try {
            // Thực hiện xóa
            $category->delete();
            return response()->json(['message' => 'Đã xóa danh mục thành công!'], 200);
        } catch (\Illuminate\Database\QueryException $e) {
            // BẢO HIỂM KHÓA NGOẠI: Bắt lỗi 23000 của Database
            if ($e->getCode() == "23000") {
                return response()->json([
                    'error' => 'Không thể xóa! Danh mục này đang được sử dụng cho một số Hồ sơ dự án.'
                ], 400);
            }
            return response()->json(['error' => 'Lỗi hệ thống không xác định.'], 500);
        }
    }
}
