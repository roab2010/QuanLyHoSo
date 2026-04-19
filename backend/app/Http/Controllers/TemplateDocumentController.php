<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\CategoryDocumentTemplate;

class TemplateDocumentController extends Controller
{
    /**
     * Lấy danh sách tài liệu mẫu theo Category ID (join document_types để lấy tên loại)
     */
    public function index($categoryId)
    {
        try {
            $templates = DB::table('category_document_templates as cdt')
                ->leftJoin('document_types as dt', 'cdt.document_type_id', '=', 'dt.id')
                ->where('cdt.category_id', $categoryId)
                ->select(
                    'cdt.id',
                    'cdt.category_id',
                    'cdt.document_type_id',
                    'cdt.document_name',
                    'cdt.sort_order',
                    'cdt.is_required',
                    'cdt.status',
                    'dt.type_name',
                    'dt.group_name'
                )
                ->orderBy('dt.type_name')
                ->orderBy('cdt.sort_order')
                ->get();

            return response()->json([
                'status' => 'success',
                'data'   => $templates
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Thêm tài liệu mẫu vào danh mục
     * Cấu trúc: category → document_type (Pháp lý) → document_name (CCCD, Sổ đỏ...)
     */
    public function store(Request $request)
    {
        $request->validate([
            'category_id'      => 'required|integer|exists:project_categories,id',
            'document_type_id' => 'required|integer|exists:document_types,id',
            'document_name'    => 'required|string|max:255',
            'is_required'      => 'nullable|boolean',
            'sort_order'       => 'nullable|integer|min:1',
        ]);

        try {
            $model = CategoryDocumentTemplate::create([
                'category_id'      => $request->category_id,
                'document_type_id' => $request->document_type_id,
                'document_name'    => $request->document_name,
                'is_required'      => $request->is_required ?? true,
                'sort_order'       => $request->sort_order ?? 1,
                'status'           => 1,
            ]);

            return response()->json([
                'message' => 'Thêm tài liệu mẫu thành công',
                'id'      => $model->id
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi database: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cập nhật tài liệu mẫu
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'document_type_id' => 'required|integer|exists:document_types,id',
            'document_name'    => 'required|string|max:255',
            'is_required'      => 'nullable|boolean',
            'sort_order'       => 'nullable|integer|min:1',
        ]);

        try {
            $model = CategoryDocumentTemplate::findOrFail($id);
            $model->update([
                'document_type_id' => $request->document_type_id,
                'document_name'    => $request->document_name,
                'is_required'      => $request->is_required ?? $model->is_required,
                'sort_order'       => $request->sort_order ?? $model->sort_order,
            ]);
            return response()->json(['message' => 'Cập nhật thành công'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Xóa tài liệu mẫu
     */
    public function destroy($id)
    {
        try {
            $model = CategoryDocumentTemplate::findOrFail($id);
            $model->delete();
            return response()->json(['message' => 'Xóa thành công'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Lấy danh sách tất cả document_types để hiển thị dropdown
     */
    public function getDocumentTypes()
    {
        try {
            $types = DB::table('document_types')
                ->select('id', 'type_name', 'group_name')
                ->orderBy('group_name')
                ->orderBy('type_name')
                ->get();
            return response()->json($types);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
