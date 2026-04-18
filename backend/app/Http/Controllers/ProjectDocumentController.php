<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ProjectDocument;
use App\Models\Project;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ProjectDocumentController extends Controller
{
    /**
     * Lấy danh sách toàn bộ tài liệu dự án kèm thông tin dự án
     */
    public function index(Request $request)
    {
        try {
            $query = ProjectDocument::with('project:id,name');

            // Lọc theo tên tài liệu
            if ($request->filled('search')) {
                $query->where('document_name', 'like', '%' . $request->search . '%');
            }

            // Lọc theo dự án
            if ($request->filled('project_id')) {
                $query->where('project_id', $request->project_id);
            }

            // Lọc theo loại tài liệu
            if ($request->filled('category')) {
                $query->where('category_name', $request->category);
            }

            $documents = $query->orderBy('uploaded_at', 'desc')->get();

            return response()->json($documents);
        } catch (\Exception $e) {
            Log::error('Lỗi lấy danh sách tài liệu: ' . $e->getMessage());
            return response()->json(['error' => 'Lỗi hệ thống khi lấy danh sách'], 500);
        }
    }

    /**
     * Tải lên tài liệu mới
     */
    public function store(Request $request)
    {
        $request->validate([
            'document_name' => 'required|string|max:255',
            'project_id'    => 'required|exists:projects,id',
            'category_name' => 'required|string',
            'file'          => 'required|file|max:10240', // Max 10MB
        ]);

        try {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('documents', $fileName, 'public');

            $document = ProjectDocument::create([
                'project_id'    => $request->project_id,
                'document_name' => $request->document_name,
                'category_name' => $request->category_name,
                'file_url'      => '/storage/' . $filePath,
                'note'          => $request->note,
                'status'        => 'PENDING',
                'uploaded_at'   => now(),
            ]);

            return response()->json([
                'message' => 'Tải lên tài liệu thành công!',
                'data'    => $document->load('project:id,name')
            ], 201);
        } catch (\Exception $e) {
            Log::error('Lỗi tải lên tài liệu: ' . $e->getMessage());
            return response()->json(['error' => 'Không thể tải lên tài liệu: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cập nhật tài liệu
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'document_name' => 'required|string|max:255',
            'project_id'    => 'required|exists:projects,id',
            'category_name' => 'required|string',
            'file'          => 'nullable|file|max:10240', // File là tùy chọn
        ]);

        try {
            $document = ProjectDocument::findOrFail($id);

            $updateData = [
                'project_id'    => $request->project_id,
                'document_name' => $request->document_name,
                'category_name' => $request->category_name,
                'note'          => $request->note,
            ];

            // Nếu người dùng chọn file mới -> Xóa file cũ, upload file mới
            if ($request->hasFile('file')) {
                // Xóa file cũ
                if ($document->file_url) {
                    $oldFilePath = str_replace('/storage/', '', $document->file_url);
                    if (Storage::disk('public')->exists($oldFilePath)) {
                        Storage::disk('public')->delete($oldFilePath);
                    }
                }

                // Lưu file mới
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('documents', $fileName, 'public');
                
                $updateData['file_url'] = '/storage/' . $filePath;
                $updateData['uploaded_at'] = now();
            }

            $document->update($updateData);

            return response()->json([
                'message' => 'Cập nhật tài liệu thành công!',
                'data'    => $document->load('project:id,name')
            ], 200);
        } catch (\Exception $e) {
            Log::error('Lỗi cập nhật tài liệu: ' . $e->getMessage());
            return response()->json(['error' => 'Không thể cập nhật tài liệu: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Xóa tài liệu
     */
    public function destroy($id)
    {
        try {
            $document = ProjectDocument::findOrFail($id);

            // Xóa tệp vật lý
            $filePath = str_replace('/storage/', '', $document->file_url);
            if (Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }

            $document->delete();

            return response()->json(['message' => 'Đã xóa tài liệu thành công']);
        } catch (\Exception $e) {
            Log::error('Lỗi khi xóa tài liệu: ' . $e->getMessage());
            return response()->json(['error' => 'Lỗi khi xóa tài liệu'], 500);
        }
    }

    /**
     * Lấy danh sách dự án và loại tài liệu để hiển thị trong dropdown
     */
    public function getMetadata()
    {
        try {
            $projects = Project::select('id', 'name')->orderBy('name')->get();
            $types = DB::table('document_types')->select('type_name as name')->get();
            
            // Nếu bảng document_types trống, cung cấp dữ liệu mặc định
            if ($types->isEmpty()) {
                $types = collect([
                    ['name' => 'Kỹ thuật'],
                    ['name' => 'Pháp lý'],
                    ['name' => 'Hợp đồng'],
                    ['name' => 'Nghiệm thu']
                ]);
            }

            return response()->json([
                'projects' => $projects,
                'types'    => $types
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Tải xuống tài liệu (fix lỗi CORS và trình duyệt)
     */
    public function downloadFile(Request $request)
    {
        $fileUrl = $request->query('url');
        if (!$fileUrl) {
            return response()->json(['error' => 'Thiếu URL'], 400);
        }

        // Tách đường dẫn từ URL (đề phòng fileUrl là dạng http://domain.com/uploads/...)
        $parsedUrl = parse_url($fileUrl, PHP_URL_PATH);

        $fullPath = null;
        if (str_starts_with($parsedUrl, '/storage/')) {
            $filePath = str_replace('/storage/', '', $parsedUrl);
            $fullPath = storage_path('app/public/' . $filePath);
        } elseif (str_starts_with($parsedUrl, '/uploads/')) {
            $filePath = str_replace('/uploads/', '', $parsedUrl);
            $fullPath = public_path('uploads/' . $filePath);
        } else {
            $fullPath = public_path(ltrim($parsedUrl, '/'));
        }

        if (!$fullPath || !file_exists($fullPath)) {
            return response()->json(['error' => 'Tài liệu vật lý không tồn tại trên máy của bạn (có thể do người khác tải lên và chưa được đồng bộ file).'], 404);
        }

        return response()->download($fullPath, basename($fullPath), [
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Expose-Headers' => 'Content-Disposition'
        ]);
    }
}
