<?php

namespace App\Http\Controllers;

use App\Models\ProjectCategory;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    // 1. Lấy danh sách (Kèm luôn các tính năng bên trong)
    public function index()
    {
        $categories = ProjectCategory::with('tasks')->get();
        return response()->json(['status' => 'success', 'data' => $categories]);
    }

    // 2. Thêm danh mục mới
    public function store(Request $request)
    {
        $category = ProjectCategory::create($request->all());
        return response()->json(['status' => 'success', 'message' => 'Thêm thành công', 'data' => $category]);
    }

    // 3. Xem chi tiết 1 danh mục (Kèm tính năng)
    public function show($id)
    {
        $category = ProjectCategory::with('tasks')->find($id);
        if (!$category) return response()->json(['message' => 'Không tìm thấy!'], 404);

        return response()->json(['status' => 'success', 'data' => $category]);
    }

    // 4. Sửa danh mục
    public function update(Request $request, $id)
    {
        $category = ProjectCategory::find($id);
        if (!$category) return response()->json(['message' => 'Không tìm thấy!'], 404);

        $category->update($request->all());
        return response()->json(['status' => 'success', 'message' => 'Sửa thành công', 'data' => $category]);
    }

    // 5. Xóa danh mục
    public function destroy($id)
    {
        ProjectCategory::destroy($id);
        return response()->json(['status' => 'success', 'message' => 'Xóa thành công']);
    }
}
