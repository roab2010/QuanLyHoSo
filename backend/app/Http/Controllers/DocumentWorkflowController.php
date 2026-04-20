<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\ProjectDocument;
use Illuminate\Support\Facades\Log;

class DocumentWorkflowController extends Controller
{
    // ===================================================================
    // LẤY CẤU HÌNH WORKFLOW (Dành cho Admin)
    // ===================================================================
    public function getWorkflows()
    {
        $workflows = DB::table('workflows')
            ->where('is_active', 1)
            ->get()
            ->map(function ($wf) {
                $wf->steps = DB::table('workflow_steps')
                    ->where('workflow_id', $wf->id)
                    ->leftJoin('roles', 'workflow_steps.role_id_assigned', '=', 'roles.id')
                    ->select('workflow_steps.*', 'roles.name as role_name')
                    ->orderBy('sort_order')
                    ->get();
                return $wf;
            });

        return response()->json($workflows);
    }

    public function getDocumentTypes()
    {
        $types = DB::table('document_types')
            ->leftJoin('workflows', 'document_types.assigned_workflow_id', '=', 'workflows.id')
            ->select('document_types.*', 'workflows.workflow_name')
            ->orderBy('document_types.group_name')
            ->orderBy('document_types.type_name')
            ->get();

        return response()->json($types);
    }

    // ===================================================================
    // TÀI LIỆU ĐANG CHỜ MÌNH DUYỆT
    // ===================================================================
    public function getPendingApprovals(Request $request)
    {
        // Lấy user_id từ header (cách hệ thống hiện tại truyền user)
        $userId = $request->header('X-User-ID');

        if (!$userId) {
            return response()->json(['error' => 'Không xác định được người dùng'], 401);
        }

        // Lấy role_id của user
        $user = DB::table('users')->where('id', $userId)->first();
        if (!$user) {
            return response()->json(['error' => 'Không tìm thấy người dùng'], 404);
        }

        $roleId = $user->role_id;

        // Lấy tất cả tài liệu mà step hiện tại match với role của user
        $docs = DB::table('project_documents')
            ->join('workflow_steps', 'project_documents.current_step_id', '=', 'workflow_steps.id')
            ->join('projects', 'project_documents.project_id', '=', 'projects.id')
            ->leftJoin('document_types', 'project_documents.document_type_id', '=', 'document_types.id')
            ->leftJoin('roles', 'workflow_steps.role_id_assigned', '=', 'roles.id')
            ->where('workflow_steps.role_id_assigned', $roleId)
            ->whereIn('project_documents.status', ['PENDING', 'PROCESSING'])
            ->select(
                'project_documents.*',
                'projects.name as project_name',
                'document_types.type_name',
                'document_types.theme_color',
                'workflow_steps.step_name as current_step_name',
                'workflow_steps.sort_order as current_step_order',
                'workflow_steps.workflow_id',
                'roles.name as approver_role_name'
            )
            ->orderBy('project_documents.uploaded_at', 'asc')
            ->get();

        // Thêm tổng số bước cho mỗi tài liệu
        $docs = $docs->map(function ($doc) {
            $totalSteps = DB::table('workflow_steps')
                ->where('workflow_id', $doc->workflow_id)
                ->count();
            $doc->total_steps = $totalSteps;
            return $doc;
        });

        return response()->json(['data' => $docs, 'total' => $docs->count()]);
    }

    // ===================================================================
    // TẤT CẢ TÀI LIỆU (Có bộ lọc)
    // ===================================================================
    public function getAllDocuments(Request $request)
    {
        $query = DB::table('project_documents')
            ->leftJoin('workflow_steps', 'project_documents.current_step_id', '=', 'workflow_steps.id')
            ->join('projects', 'project_documents.project_id', '=', 'projects.id')
            ->leftJoin('document_types', 'project_documents.document_type_id', '=', 'document_types.id')
            ->leftJoin('roles', 'workflow_steps.role_id_assigned', '=', 'roles.id')
            ->select(
                'project_documents.*',
                'projects.name as project_name',
                'document_types.type_name',
                'document_types.theme_color',
                'workflow_steps.step_name as current_step_name',
                'workflow_steps.sort_order as current_step_order',
                'workflow_steps.workflow_id',
                'roles.name as approver_role_name'
            );

        if ($request->filled('status')) {
            $query->where('project_documents.status', $request->status);
        }
        if ($request->filled('project_id')) {
            $query->where('project_documents.project_id', $request->project_id);
        }
        if ($request->filled('search')) {
            $query->where('project_documents.document_name', 'like', '%' . $request->search . '%');
        }

        $docs = $query->orderBy('project_documents.uploaded_at', 'desc')->get();

        $docs = $docs->map(function ($doc) {
            if ($doc->workflow_id) {
                $totalSteps = DB::table('workflow_steps')
                    ->where('workflow_id', $doc->workflow_id)
                    ->count();
                $doc->total_steps = $totalSteps;
            } else {
                $doc->total_steps = 0;
            }
            return $doc;
        });

        return response()->json(['data' => $docs]);
    }

    // ===================================================================
    // DUYỆT (APPROVE)
    // ===================================================================
    public function approve(Request $request, $docId)
    {
        $request->validate(['comment' => 'nullable|string|max:1000']);

        $userId = $request->header('X-User-ID');
        $user = DB::table('users')->where('id', $userId)->first();
        if (!$user) return response()->json(['error' => 'Không tìm thấy người dùng'], 404);

        $doc = ProjectDocument::find($docId);
        if (!$doc) return response()->json(['error' => 'Không tìm thấy tài liệu'], 404);

        $currentStep = DB::table('workflow_steps')->where('id', $doc->current_step_id)->first();
        if (!$currentStep) return response()->json(['error' => 'Tài liệu không có bước duyệt'], 422);

        // Kiểm tra quyền
        if ($user->role_id != $currentStep->role_id_assigned) {
            return response()->json(['error' => 'Bạn không có quyền duyệt bước này'], 403);
        }

        DB::beginTransaction();
        try {
            // Ghi log
            DB::table('document_workflow_logs')->insert([
                'document_id'  => $docId,
                'step_id'      => $currentStep->id,
                'processor_id' => $userId,
                'action'       => 'APPROVE',
                'comment'      => $request->comment,
                'created_at'   => now(),
            ]);

            // Tìm bước tiếp theo
            $nextStep = DB::table('workflow_steps')
                ->where('workflow_id', $currentStep->workflow_id)
                ->where('sort_order', '>', $currentStep->sort_order)
                ->orderBy('sort_order')
                ->first();

            if ($nextStep) {
                // Còn bước → Chuyền gậy
                $doc->update([
                    'current_step_id' => $nextStep->id,
                    'status'          => 'PROCESSING',
                ]);
                $message = "Đã duyệt bước \"{$currentStep->step_name}\". Chuyển sang: \"{$nextStep->step_name}\"";
            } else {
                // Hết bước → Về đích
                $doc->update([
                    'current_step_id' => null,
                    'status'          => 'COMPLETED',
                    'completed_at'    => now(),
                ]);
                $message = 'Tài liệu đã được duyệt hoàn tất!';
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => $message]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Lỗi Approve: ' . $e->getMessage());
            return response()->json(['error' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
        }
    }

    // ===================================================================
    // YÊU CẦU SỬA (REVISE) — Đẩy về bước 1
    // ===================================================================
    public function revise(Request $request, $docId)
    {
        $request->validate(['comment' => 'required|string|max:1000']);

        $userId = $request->header('X-User-ID');
        $user = DB::table('users')->where('id', $userId)->first();
        if (!$user) return response()->json(['error' => 'Không tìm thấy người dùng'], 404);

        $doc = ProjectDocument::find($docId);
        if (!$doc) return response()->json(['error' => 'Không tìm thấy tài liệu'], 404);

        $currentStep = DB::table('workflow_steps')->where('id', $doc->current_step_id)->first();
        if (!$currentStep) return response()->json(['error' => 'Tài liệu không có bước duyệt'], 422);

        if ($user->role_id != $currentStep->role_id_assigned) {
            return response()->json(['error' => 'Bạn không có quyền thao tác bước này'], 403);
        }

        // Tìm Step 1 của workflow này
        $firstStep = DB::table('workflow_steps')
            ->where('workflow_id', $currentStep->workflow_id)
            ->orderBy('sort_order')
            ->first();

        DB::beginTransaction();
        try {
            DB::table('document_workflow_logs')->insert([
                'document_id'  => $docId,
                'step_id'      => $currentStep->id,
                'processor_id' => $userId,
                'action'       => 'REVISE',
                'comment'      => $request->comment,
                'created_at'   => now(),
            ]);

            $doc->update([
                'current_step_id' => $firstStep->id,
                'status'          => 'REVISION',
            ]);

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Đã yêu cầu sửa lại. Hồ sơ được trả về bước đầu tiên.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ===================================================================
    // TỪ CHỐI (REJECT) — Đóng quy trình
    // ===================================================================
    public function reject(Request $request, $docId)
    {
        $request->validate(['comment' => 'required|string|max:1000']);

        $userId = $request->header('X-User-ID');
        $user = DB::table('users')->where('id', $userId)->first();
        if (!$user) return response()->json(['error' => 'Không tìm thấy người dùng'], 404);

        $doc = ProjectDocument::find($docId);
        if (!$doc) return response()->json(['error' => 'Không tìm thấy tài liệu'], 404);

        $currentStep = DB::table('workflow_steps')->where('id', $doc->current_step_id)->first();
        if (!$currentStep) return response()->json(['error' => 'Tài liệu không có bước duyệt'], 422);

        if ($user->role_id != $currentStep->role_id_assigned) {
            return response()->json(['error' => 'Bạn không có quyền thao tác bước này'], 403);
        }

        DB::beginTransaction();
        try {
            DB::table('document_workflow_logs')->insert([
                'document_id'  => $docId,
                'step_id'      => $currentStep->id,
                'processor_id' => $userId,
                'action'       => 'REJECT',
                'comment'      => $request->comment,
                'created_at'   => now(),
            ]);

            $doc->update([
                'current_step_id' => null,
                'status'          => 'REJECTED',
            ]);

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Đã từ chối tài liệu.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ===================================================================
    // NỘP LẠI (RESUBMIT) — Nhân viên nộp file sau khi REVISE
    // ===================================================================
    public function resubmit(Request $request, $docId)
    {
        $userId = $request->header('X-User-ID');
        if (!$userId) return response()->json(['error' => 'Không xác định được người dùng'], 401);

        $doc = ProjectDocument::find($docId);
        if (!$doc) return response()->json(['error' => 'Không tìm thấy tài liệu'], 404);

        if ($doc->status !== 'REVISION') {
            return response()->json(['error' => 'Tài liệu không ở trạng thái cần sửa'], 422);
        }

        DB::beginTransaction();
        try {
            $updateData = [
                'status'       => 'PENDING',
                'uploaded_at'  => now(),
            ];

            // Nếu có file mới đính kèm
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $destPath = public_path('uploads/documents');
                if (!file_exists($destPath)) mkdir($destPath, 0777, true);
                $file->move($destPath, $fileName);
                $updateData['file_url'] = '/uploads/documents/' . $fileName;
            }

            $doc->update($updateData);

            // Ghi log Nộp lại
            $currentStep = DB::table('workflow_steps')->where('id', $doc->current_step_id)->first();
            DB::table('document_workflow_logs')->insert([
                'document_id'  => $docId,
                'step_id'      => $doc->current_step_id,
                'processor_id' => $userId,
                'action'       => 'RESUBMIT',
                'comment'      => $request->comment ?? 'Đã sửa và nộp lại',
                'created_at'   => now(),
            ]);

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Đã nộp lại tài liệu. Đang chờ duyệt lại.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ===================================================================
    // LỊCH SỬ DUYỆT CỦA 1 TÀI LIỆU (Timeline)
    // ===================================================================
    public function getWorkflowLogs($docId)
    {
        $logs = DB::table('document_workflow_logs')
            ->where('document_id', $docId)
            ->leftJoin('users', 'document_workflow_logs.processor_id', '=', 'users.id')
            ->leftJoin('workflow_steps', 'document_workflow_logs.step_id', '=', 'workflow_steps.id')
            ->select(
                'document_workflow_logs.*',
                'users.full_name as processor_name',
                'users.image as processor_image',
                'workflow_steps.step_name'
            )
            ->orderBy('document_workflow_logs.created_at', 'desc')
            ->get();

        return response()->json(['data' => $logs]);
    }
}
