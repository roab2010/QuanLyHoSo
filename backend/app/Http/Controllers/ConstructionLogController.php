<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ConstructionLog;
use App\Models\ConstructionLogImage;
use Illuminate\Support\Facades\Log;

class ConstructionLogController extends Controller
{
    /**
     * Lấy danh sách nhật ký thi công theo dự án (mới nhất trước)
     */
    public function index($projectId)
    {
        try {
            $logs = ConstructionLog::with('images')
                ->where('project_id', $projectId)
                ->orderBy('log_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'logs' => $logs
            ]);
        } catch (\Exception $e) {
            Log::error('Lỗi lấy nhật ký thi công: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Tạo nhật ký thi công mới (kèm upload nhiều ảnh)
     */
    public function store(Request $request, $projectId)
    {
        $request->validate([
            'log_date' => 'required|date',
            'description' => 'nullable|string',
            'title' => 'nullable|string|max:255',
            'weather' => 'nullable|string|max:50',
            'created_by' => 'nullable|string|max:100',
            'images' => 'nullable|array',
            'images.*' => 'image|max:10240', // Max 10MB mỗi ảnh
            'captions' => 'nullable|array',
        ]);

        try {
            $log = ConstructionLog::create([
                'project_id' => $projectId,
                'log_date' => $request->log_date,
                'title' => $request->title,
                'description' => $request->description,
                'weather' => $request->weather,
                'created_by' => $request->created_by,
            ]);

            // Upload ảnh
            if ($request->hasFile('images')) {
                $destPath = public_path('uploads/construction-logs');
                if (!file_exists($destPath)) {
                    mkdir($destPath, 0777, true);
                }

                foreach ($request->file('images') as $index => $image) {
                    $fileName = time() . '_' . $index . '_' . $image->getClientOriginalName();
                    $image->move($destPath, $fileName);

                    ConstructionLogImage::create([
                        'construction_log_id' => $log->id,
                        'image_url' => '/uploads/construction-logs/' . $fileName,
                        'caption' => $request->captions[$index] ?? null,
                        'taken_at' => now(),
                    ]);
                }
            }

            $log->load('images');

            return response()->json([
                'success' => true,
                'message' => 'Đã tạo nhật ký thi công',
                'log' => $log
            ], 201);
        } catch (\Exception $e) {
            Log::error('Lỗi tạo nhật ký thi công: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Thêm ảnh vào nhật ký đã có
     */
    public function addImages(Request $request, $logId)
    {
        $request->validate([
            'images' => 'required|array',
            'images.*' => 'image|max:10240',
            'captions' => 'nullable|array',
        ]);

        try {
            $log = ConstructionLog::findOrFail($logId);

            $destPath = public_path('uploads/construction-logs');
            if (!file_exists($destPath)) {
                mkdir($destPath, 0777, true);
            }

            $newImages = [];
            foreach ($request->file('images') as $index => $image) {
                $fileName = time() . '_' . $index . '_' . $image->getClientOriginalName();
                $image->move($destPath, $fileName);

                $img = ConstructionLogImage::create([
                    'construction_log_id' => $log->id,
                    'image_url' => '/uploads/construction-logs/' . $fileName,
                    'caption' => $request->captions[$index] ?? null,
                    'taken_at' => now(),
                ]);
                $newImages[] = $img;
            }

            return response()->json([
                'success' => true,
                'message' => 'Đã thêm ' . count($newImages) . ' ảnh',
                'images' => $newImages
            ]);
        } catch (\Exception $e) {
            Log::error('Lỗi thêm ảnh nhật ký: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Xóa 1 ảnh
     */
    public function deleteImage($imageId)
    {
        try {
            $image = ConstructionLogImage::findOrFail($imageId);

            // Xóa file vật lý
            $filePath = public_path(ltrim($image->image_url, '/'));
            if (file_exists($filePath)) {
                @unlink($filePath);
            }

            $image->delete();

            return response()->json(['success' => true, 'message' => 'Đã xóa ảnh']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Xóa nhật ký + toàn bộ ảnh
     */
    public function destroy($logId)
    {
        try {
            $log = ConstructionLog::with('images')->findOrFail($logId);

            // Xóa file vật lý
            foreach ($log->images as $img) {
                $filePath = public_path(ltrim($img->image_url, '/'));
                if (file_exists($filePath)) {
                    @unlink($filePath);
                }
            }

            $log->delete(); // cascade sẽ xóa images trong DB

            return response()->json(['success' => true, 'message' => 'Đã xóa nhật ký thi công']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
