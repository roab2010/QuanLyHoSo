<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TemplateDocumentController extends Controller
{
    /**
     * Lấy danh sách mẫu tài liệu theo Category ID
     */
    public function index($categoryId)
    {
        try {
            $templates = DB::table('category_document_templates')
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
     * Lưu một mẫu tài liệu mới
     */
    public function store(Request $request)
    {
        $request->validate([
            'category_id'   => 'required|integer',
            'document_name' => 'required|string|max:255',
            'category_name' => 'nullable|string|max:100',
            'is_required'   => 'boolean',
            'sort_order'    => 'required|integer',
        ]);

        try {
            $id = DB::table('category_document_templates')->insertGetId([
                'category_id'   => $request->category_id,
                'document_name' => $request->document_name,
                'category_name' => $request->category_name ?? 'Khác',
                'is_required'   => $request->is_required ?? true,
                'sort_order'    => $request->sort_order,
                'created_at'    => now(),
            ]);

            return response()->json([
                'message' => 'Thêm mẫu tài liệu thành công',
                'id' => $id
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi database: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cập nhật mẫu tài liệu
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'document_name' => 'required|string|max:255',
            'category_name' => 'nullable|string|max:100',
            'is_required'   => 'boolean',
            'sort_order'    => 'required|integer',
        ]);

        try {
            DB::table('category_document_templates')->where('id', $id)->update([
                'document_name' => $request->document_name,
                'category_name' => $request->category_name ?? 'Khác',
                'is_required'   => $request->is_required ?? true,
                'sort_order'    => $request->sort_order,
                'updated_at'    => now(),
            ]);

            return response()->json(['message' => 'Cập nhật thành công'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Xóa mẫu tài liệu
     */
    public function destroy($id)
    {
        try {
            DB::table('category_document_templates')->where('id', $id)->delete();
            return response()->json(['message' => 'Xóa thành công'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
