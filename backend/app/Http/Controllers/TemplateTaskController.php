<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\CategoryTaskTemplate;

class TemplateTaskController extends Controller
{
    /**
     * Lấy danh sách quy trình mẫu theo Category ID
     */
    public function index($categoryId)
    {
        try {
            $templates = DB::table('category_task_templates')
                ->where('category_id', $categoryId)
                ->orderBy('sort_order', 'asc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $templates
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Lưu một quy trình mẫu mới
     */
    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'required|integer',
            'task_name'   => 'required|string|max:255',
            'work_volume' => 'required|numeric',
            'sort_order'  => 'required|integer',
        ]);

        try {
            $model = CategoryTaskTemplate::create([
                'category_id' => $request->category_id,
                'task_name'   => $request->task_name,
                'work_volume' => $request->work_volume,
                'sort_order'  => $request->sort_order,
            ]);

            return response()->json([
                'message' => 'Thêm mẫu thành công',
                'id' => $model->id
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi database: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cập nhật quy trình mẫu
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'task_name'   => 'required|string|max:255',
            'work_volume' => 'required|numeric',
            'sort_order'  => 'required|integer',
        ]);

        try {
            $model = CategoryTaskTemplate::findOrFail($id);
            $model->update([
                'task_name'   => $request->task_name,
                'work_volume' => $request->work_volume,
                'sort_order'  => $request->sort_order,
            ]);

            return response()->json(['message' => 'Cập nhật thành công'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Xóa quy trình mẫu
     */
    public function destroy($id)
    {
        try {
            $model = CategoryTaskTemplate::findOrFail($id);
            $model->delete();
            return response()->json(['message' => 'Xóa thành công'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
