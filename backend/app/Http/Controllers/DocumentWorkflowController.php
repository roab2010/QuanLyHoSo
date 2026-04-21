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

        // Đính kèm danh sách các Role ID có trong quy trình này
        foreach ($types as $type) {
            if ($type->assigned_workflow_id) {
                $nativeRoles = DB::table('workflow_steps')
                    ->where('workflow_id', $type->assigned_workflow_id)
                    ->pluck('role_id_assigned')
                    ->toArray();

                $globalRoles = DB::table('workflow_project_approvers')
                    ->where('scope_type', 'global')
                    ->where('document_type_id', $type->id)
                    ->pluck('role_id')
                    ->toArray();

                // Gộp native và global, xóa trùng và đánh lại index
                $type->workflow_role_ids = array_values(array_unique(array_merge($nativeRoles, $globalRoles)));
            } else {
                $type->workflow_role_ids = [];
            }
        }

        return response()->json($types);
    }

    // ===================================================================
    // TÀI LIỆU ĐANG CHỜ MÌNH DUYỆT
    // ===================================================================
    public function getPendingApprovals(Request $request)
    {
        $userId = $request->header('X-User-ID');

        if (!$userId) {
            return response()->json(['error' => 'Không xác định được người dùng'], 401);
        }

        $user = DB::table('users')->where('id', $userId)->first();
        if (!$user) {
            return response()->json(['error' => 'Không tìm thấy người dùng'], 404);
        }
        $roleId = $user->role_id;

        // Bỏ logic early return cho Admin, để Admin cũng đi qua filter 
        // để chỉ lọc đúng những hồ sơ đang chờ bước Giám đốc (Role 1).

        // --- BƯỚC 1: TÌM CÁC DỰ ÁN & DANH MỤC ĐƯỢC CHỈ ĐỊNH ĐẶC BIỆT ---
        // Người này (bằng ID hoặc Role) có được chỉ định cụ thể cho dự án nào không?
        $assignedProjectScopes = DB::table('workflow_project_approvers')
            ->where('scope_type', 'project')
            ->where(function($q) use ($userId, $roleId) {
                $q->where('user_id', $userId)->orWhere('role_id', $roleId);
            })
            ->get();

        $assignedCategoryScopes = DB::table('workflow_project_approvers')
            ->where('scope_type', 'category')
            ->where(function($q) use ($userId, $roleId) {
                $q->where('user_id', $userId)->orWhere('role_id', $roleId);
            })
            ->get();

        // Xây dựng danh sách mảng dễ tra cứu
        // Format: [ step_id => [ project_id1, project_id2... ] ]
        $userStepProjects = [];
        foreach ($assignedProjectScopes as $scope) {
            $userStepProjects[$scope->workflow_step_id][] = $scope->scope_id;
        }

        // Format: [ step_id => [ category_id1, category_id2... ] ]
        $userStepCategories = [];
        foreach ($assignedCategoryScopes as $scope) {
            $userStepCategories[$scope->workflow_step_id][] = $scope->scope_id;
        }

        // --- BƯỚC 2: TÌM CÁC TÀI LIỆU ĐANG CHỜ DUYỆT TRONG HỆ THỐNG ---
        // Lấy tất cả tài liệu đang ở trạng thái chờ
        $pendingDocsQuery = DB::table('project_documents')
            ->join('workflow_steps', 'project_documents.current_step_id', '=', 'workflow_steps.id')
            ->join('projects', 'project_documents.project_id', '=', 'projects.id')
            ->leftJoin('document_types', 'project_documents.document_type_id', '=', 'document_types.id')
            ->leftJoin('roles', 'workflow_steps.role_id_assigned', '=', 'roles.id')
            ->whereIn('project_documents.status', ['PENDING', 'PROCESSING'])
            ->select(
                'project_documents.*',
                'projects.name as project_name',
                'projects.category_id as project_category_id',
                'document_types.type_name',
                'document_types.theme_color',
                'workflow_steps.step_name as current_step_name',
                'workflow_steps.sort_order as current_step_order',
                'workflow_steps.workflow_id',
                'roles.id as global_role_id',
                'roles.name as approver_role_name'
            );

        $allPendingDocs = $pendingDocsQuery->get();

        // --- BƯỚC 3: LỌC TÀI LIỆU THEO QUY TẮC MỚI ---
        $filteredDocs = $allPendingDocs->filter(function ($doc) use ($userId, $roleId) {
            $stepId = $doc->current_step_id;
            $projectId = $doc->project_id;
            $categoryId = $doc->project_category_id;
            $docTypeId = $doc->document_type_id;

            // 1. Kiểm tra xem user có quyền ĐẶC BIỆT (Dự án / Danh mục) CHỈ ĐỊNH RIÊNG cho mình không?
            //    Phân quyền này có thể gán cho 1 user_id cụ thể hoặc 1 role_id
            $userHasSpecificPermission = DB::table('workflow_project_approvers')
                ->where('workflow_step_id', $stepId)
                ->where(function($q) use ($projectId, $categoryId) {
                    $q->where(function($sq) use ($projectId) {
                        $sq->where('scope_type', 'project')->where('scope_id', $projectId);
                    })->orWhere(function($sq) use ($categoryId) {
                        $sq->where('scope_type', 'category')->where('scope_id', $categoryId);
                    })->orWhere(function($sq) {
                        $sq->where('scope_type', 'global');
                    });
                })
                ->where(function($q) use ($userId, $roleId) {
                    $q->where('user_id', $userId)->orWhere('role_id', $roleId);
                })
                ->where(function($q) use ($docTypeId) {
                    $q->whereNull('document_type_id')->orWhere('document_type_id', $docTypeId);
                })
                ->exists();

            if ($userHasSpecificPermission) {
                return true;
            }

            // Dành cho Role 1 (Admin/Giám đốc): Xuyên qua mọi rào cản Project.
            // Chỉ cần đúng Bước hiện tại là Role Giám đốc thì sẽ thấy.
            if ($roleId == 1) {
                return $doc->global_role_id == 1;
            }

            // 2. Nếu bất kỳ ai CHỈ ĐỊNH RIÊNG cho scope này (Project/Cat + DocType) -> Tôi không được xem nếu không phải tôi
            $hasAnyAssignmentForScope = DB::table('workflow_project_approvers')
                ->where('workflow_step_id', $stepId)
                ->where(function($q) use ($projectId, $categoryId) {
                    $q->where(function($sq) use ($projectId) {
                        $sq->where('scope_type', 'project')->where('scope_id', $projectId);
                    })->orWhere(function($sq) use ($categoryId) {
                        $sq->where('scope_type', 'category')->where('scope_id', $categoryId);
                    });
                })
                ->where(function($q) use ($docTypeId) {
                    $q->whereNull('document_type_id')->orWhere('document_type_id', $docTypeId);
                })
                ->exists();

            if ($hasAnyAssignmentForScope && !$userHasSpecificPermission) {
                return false;
            }

            // 3. LOGIC EXCLUSIVE: Nếu tôi ĐÃ CÓ phân quyền đặc biệt ở đâu đó trong bảng này cho bước này,
            //    thì tôi MẤT QUYỀN nhìn thấy các dự án "vô chủ" (chạy theo role chung).
            $userIsSpecialistForThisStep = DB::table('workflow_project_approvers')
                ->where('workflow_step_id', $stepId)
                ->where(function($q) use ($userId, $roleId) {
                    $q->where('user_id', $userId)->orWhere('role_id', $roleId);
                })
                ->exists();

            if ($userIsSpecialistForThisStep) {
                // Đã là chuyên gia cho bước này ở một dự án nào đó -> Chỉ được thấy những project được gán (đã return true ở trên)
                return false;
            }

            // 4. Cuối cùng: Nếu không có ai bị gán riêng, và tôi không phải chuyên gia riêng của bước này -> Check theo Role hệ thống
            if ($doc->global_role_id == $roleId) {
                return true;
            }

            return false;
        })->values();

        // Gắn thêm số bước
        $filteredDocs = $filteredDocs->map(function ($doc) {
            $totalSteps = DB::table('workflow_steps')
                ->where('workflow_id', $doc->workflow_id)
                ->count();
            $doc->total_steps = $totalSteps;
            return $doc;
        });

        // Sắp xếp lại theo thời gian
        $sortedDocs = $filteredDocs->sortBy('uploaded_at')->values();

        return response()->json(['data' => $sortedDocs, 'total' => $sortedDocs->count()]);
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

    // helper function kiểm tra quyền cho approve/reject/revise 
    private function currentUserCanApprove($user, $doc, $currentStep) {
        $userId = $user->id;
        $roleId = $user->role_id;

        // Admin (Role 1) luôn có quyền bypass
        if ($roleId == 1) return true;

        $stepId = $currentStep->id;
        $projectId = $doc->project_id;
        $project = DB::table('projects')->where('id', $projectId)->first();
        $categoryId = $project->category_id;
        $docTypeId = $doc->document_type_id;

        // 1. Kiểm tra quyền ĐẶC BIỆT gán cho tôi
        $userHasSpecificPermission = DB::table('workflow_project_approvers')
            ->where('workflow_step_id', $stepId)
            ->where(function($q) use ($projectId, $categoryId) {
                $q->where(function($sq) use ($projectId) {
                    $sq->where('scope_type', 'project')->where('scope_id', $projectId);
                })->orWhere(function($sq) use ($categoryId) {
                    $sq->where('scope_type', 'category')->where('scope_id', $categoryId);
                })->orWhere(function($sq) {
                    $sq->where('scope_type', 'global');
                });
            })
            ->where(function($q) use ($userId, $roleId) {
                $q->where('user_id', $userId)->orWhere('role_id', $roleId);
            })
            ->where(function($q) use ($docTypeId) {
                $q->whereNull('document_type_id')->orWhere('document_type_id', $docTypeId);
            })
            ->exists();

        if ($userHasSpecificPermission) return true;

        // 2. Nếu scope này có gán cho ai đó (tồn tại trong bảng) => Mà tôi k đc gán thì return false
        $hasAnyAssignmentForScope = DB::table('workflow_project_approvers')
            ->where('workflow_step_id', $stepId)
            ->where(function($q) use ($projectId, $categoryId) {
                $q->where(function($sq) use ($projectId) {
                    $sq->where('scope_type', 'project')->where('scope_id', $projectId);
                })->orWhere(function($sq) use ($categoryId) {
                    $sq->where('scope_type', 'category')->where('scope_id', $categoryId);
                });
            })
            ->where(function($q) use ($docTypeId) {
                $q->whereNull('document_type_id')->orWhere('document_type_id', $docTypeId);
            })
            ->exists();

        if ($hasAnyAssignmentForScope && !$userHasSpecificPermission) return false;

        // 3. Logic Exclusive
        $userIsSpecialistForThisStep = DB::table('workflow_project_approvers')
            ->where('workflow_step_id', $stepId)
            ->where(function($q) use ($userId, $roleId) {
                $q->where('user_id', $userId)->orWhere('role_id', $roleId);
            })
            ->exists();

        if ($userIsSpecialistForThisStep) return false;

        // 4. Role mặc định
        if ($user->role_id == $currentStep->role_id_assigned) {
            return true;
        }

        return false;
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

        // Kiểm tra quyền (phiên bản mới)
        if (!$this->currentUserCanApprove($user, $doc, $currentStep)) {
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

        // Kiểm tra quyền
        if (!$this->currentUserCanApprove($user, $doc, $currentStep)) {
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

        // Kiểm tra quyền
        if (!$this->currentUserCanApprove($user, $doc, $currentStep)) {
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

    // ===================================================================
    // API PHÂN QUYỀN THEO SCOPE DỰ ÁN / DANH MỤC (Dành cho Admin)
    // ===================================================================
    
    public function getApprovers(Request $request)
    {
        $query = DB::table('workflow_project_approvers as wpa')
            ->leftJoin('document_types as dt', 'wpa.document_type_id', '=', 'dt.id')
            ->leftJoin('workflow_steps as ws', 'wpa.workflow_step_id', '=', 'ws.id')
            ->leftJoin('users as u', 'wpa.user_id', '=', 'u.id')
            ->leftJoin('roles as r', 'wpa.role_id', '=', 'r.id')
            ->select(
                'wpa.id',
                'wpa.scope_type',
                'wpa.scope_id',
                'wpa.user_id',
                'wpa.role_id',
                'wpa.document_type_id',
                'dt.type_name as document_type_name',
                'ws.step_name',
                'u.full_name as assigned_user_name',
                'r.name as assigned_role_name'
            );

        if ($request->filled('scope_type')) {
            $query->where('wpa.scope_type', $request->scope_type);
        }

        if ($request->filled('scope_id')) {
            $query->where('wpa.scope_id', $request->scope_id);
        }

        if ($request->filled('role_id')) {
            $query->where('wpa.role_id', $request->role_id);
        }

        if ($request->filled('user_id')) {
            $query->where('wpa.user_id', $request->user_id);
        }

        $approvers = $query->orderBy('wpa.id', 'desc')->get();

        return response()->json(['data' => $approvers]);
    }

    public function grantApprover(Request $request)
    {
        $adminUserId = $request->header('X-User-ID');
        $admin = DB::table('users')->where('id', $adminUserId)->first();
        if (!$admin || $admin->role_id != 1) return response()->json(['error' => 'Quyền truy cập bị từ chối'], 403);

        $request->validate([
            'document_type_ids' => 'required|array',
            'document_type_ids.*' => 'integer',
            'scope_type'        => 'required|in:project,category,global',
            'scope_id'          => 'required|integer',
            'user_id'           => 'nullable|integer',
            'role_id'           => 'nullable|integer',
        ]);

        if (!$request->user_id && !$request->role_id) {
            return response()->json(['error' => 'Phải chọn User cụ thể hoặc Role'], 422);
        }

        // Xác định Role của người được gán
        $targetRoleId = $request->role_id;
        if (!$targetRoleId && $request->user_id) {
            $targetUser = DB::table('users')->where('id', $request->user_id)->first();
            if ($targetUser) $targetRoleId = $targetUser->role_id;
        }

        if (!$targetRoleId) return response()->json(['error' => 'Không xác định được Role của người được gán'], 422);

        DB::beginTransaction();
        try {
            $successCount = 0;
            foreach ($request->document_type_ids as $dtId) {
                // Lấy thông tin loại tài liệu và quy trình tương ứng
                $docType = DB::table('document_types')->where('id', $dtId)->first();
                if (!$docType || !$docType->assigned_workflow_id) continue;

                // TÌM BƯỚC DUYỆT trong quy trình này dành cho ROLE của người này
                $matchingStep = DB::table('workflow_steps')
                    ->where('workflow_id', $docType->assigned_workflow_id)
                    ->where('role_id_assigned', $targetRoleId)
                    ->first();

                // PHƯƠNG ÁN B (Ghi đè ngoại lệ): Nếu người này KHÔNG có chức vụ nằm trong quy trình mặc định,
                // Giám đốc vẫn có thể ép quyền cho họ. Lúc này hệ thống sẽ tự động gán họ vào BƯỚC ĐẦU TIÊN
                // của quy trình đó để họ có quyền tham gia.
                if (!$matchingStep) {
                    $matchingStep = DB::table('workflow_steps')
                        ->where('workflow_id', $docType->assigned_workflow_id)
                        ->orderBy('sort_order', 'asc')
                        ->first();
                }

                if (!$matchingStep) {
                    throw new \Exception("Loại tài liệu \"{$docType->type_name}\" hiện chưa được cấu hình bất kỳ bước duyệt nào trong cài đặt quy trình.");
                }

                // Gán quyền
                DB::table('workflow_project_approvers')->updateOrInsert(
                    [
                        'workflow_step_id' => $matchingStep->id,
                        'scope_type'       => $request->scope_type,
                        'scope_id'         => $request->scope_id,
                        'user_id'          => $request->user_id,
                        'role_id'          => $request->role_id,
                        'document_type_id' => $dtId,
                    ],
                    [
                        'granted_by' => $adminUserId,
                        'created_at' => now(),
                    ]
                );
                $successCount++;
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => "Cấp quyền thành công cho $successCount loại tài liệu."]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 422); // Trả về lỗi validate cho user
        }
    }

    public function revokeApprover(Request $request, $id)
    {
        $userId = $request->header('X-User-ID');
        $adminOptions = DB::table('users')->where('id', $userId)->first();
        if (!$adminOptions || $adminOptions->role_id != 1) return response()->json(['error' => 'Quyền truy cập bị từ chối'], 403);

        try {
            DB::table('workflow_project_approvers')->where('id', $id)->delete();
            return response()->json(['success' => true, 'message' => 'Đã thu hồi quyền']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ===================================================================
    // QUẢN LÝ QUY TRÌNH (WORKFLOW CRUD) - Chỉ Admin
    // ===================================================================

    private function isAdmin(Request $request)
    {
        $userId = $request->header('X-User-ID');
        $user = DB::table('users')->where('id', $userId)->first();
        return $user && $user->role_id == 1;
    }

    public function createWorkflow(Request $request)
    {
        if (!$this->isAdmin($request)) return response()->json(['error' => 'Quyền truy cập bị từ chối'], 403);

        $request->validate([
            'workflow_name' => 'required|string|max:255',
            'workflow_code' => 'required|string|max:50|unique:workflows,workflow_code',
            'description'   => 'nullable|string',
        ]);

        try {
            $id = DB::table('workflows')->insertGetId([
                'workflow_name' => $request->workflow_name,
                'workflow_code' => strtoupper($request->workflow_code),
                'description'   => $request->description,
                'is_active'     => 1,
                'created_at'    => now(),
            ]);

            $workflow = DB::table('workflows')->where('id', $id)->first();
            $workflow->steps = [];
            return response()->json(['success' => true, 'data' => $workflow], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateWorkflow(Request $request, $id)
    {
        if (!$this->isAdmin($request)) return response()->json(['error' => 'Quyền truy cập bị từ chối'], 403);

        $request->validate([
            'workflow_name' => 'required|string|max:255',
            'description'   => 'nullable|string',
            'is_active'     => 'nullable|boolean',
        ]);

        try {
            DB::table('workflows')->where('id', $id)->update([
                'workflow_name' => $request->workflow_name,
                'description'   => $request->description,
                'is_active'     => $request->is_active ?? 1,
            ]);
            return response()->json(['success' => true, 'message' => 'Cập nhật quy trình thành công']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function deleteWorkflow(Request $request, $id)
    {
        if (!$this->isAdmin($request)) return response()->json(['error' => 'Quyền truy cập bị từ chối'], 403);

        // 1. Kiểm tra xem có hồ sơ (documents) nào ĐANG CHẠY quy trình này không
        $activeDocCount = DB::table('project_documents')
            ->whereIn('status', ['PENDING', 'PROCESSING'])
            ->whereExists(function ($query) use ($id) {
                $query->select(DB::raw(1))
                      ->from('workflow_steps')
                      ->whereColumn('workflow_steps.id', 'project_documents.current_step_id')
                      ->where('workflow_steps.workflow_id', $id);
            })
            ->count();

        if ($activeDocCount > 0) {
            return response()->json(['error' => "Không thể xóa! Có $activeDocCount hồ sơ đang trong quá trình duyệt theo quy trình này. Hãy hoàn thành hoặc hủy hồ sơ đó trước."], 400);
        }

        try {
            DB::beginTransaction();

            // 2. Gỡ bỏ các liên kết trong cấu hình loại tài liệu (bảng cũ)
            DB::table('document_types')
                ->where('assigned_workflow_id', $id)
                ->update(['assigned_workflow_id' => null]);

            // 3. Xóa các bước duyệt (workflow_steps)
            DB::table('workflow_steps')->where('workflow_id', $id)->delete();

            // 4. Xóa các gán quy trình (workflow_assignments)
            DB::table('workflow_assignments')->where('workflow_id', $id)->delete();

            // 5. Xóa quy trình
            DB::table('workflows')->where('id', $id)->delete();

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Đã xóa quy trình và gỡ bỏ các liên kết liên quan']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ===================================================================
    // QUẢN LÝ BƯỚC DUYỆT (STEP CRUD)
    // ===================================================================

    public function createStep(Request $request, $workflowId)
    {
        if (!$this->isAdmin($request)) return response()->json(['error' => 'Quyền truy cập bị từ chối'], 403);

        $request->validate([
            'step_name'    => 'required|string|max:255',
            'role_id'      => 'nullable|exists:roles,id',
            'expected_days'=> 'nullable|integer|min:1',
            'has_digital_signature' => 'nullable|boolean',
        ]);

        try {
            $maxOrder = DB::table('workflow_steps')->where('workflow_id', $workflowId)->max('sort_order') ?? 0;

            $stepId = DB::table('workflow_steps')->insertGetId([
                'workflow_id'          => $workflowId,
                'step_name'            => $request->step_name,
                'role_id_assigned'     => $request->role_id ?: null,
                'expected_days'        => $request->expected_days ?? 1,
                'has_digital_signature'=> $request->has_digital_signature ?? false,
                'sort_order'           => $maxOrder + 1,
            ]);

            $step = DB::table('workflow_steps')
                ->where('workflow_steps.id', $stepId)
                ->leftJoin('roles', 'workflow_steps.role_id_assigned', '=', 'roles.id')
                ->select('workflow_steps.*', 'roles.name as role_name', 'roles.color as role_color')
                ->first();

            return response()->json(['success' => true, 'data' => $step], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateStep(Request $request, $workflowId, $stepId)
    {
        if (!$this->isAdmin($request)) return response()->json(['error' => 'Quyền truy cập bị từ chối'], 403);

        $request->validate([
            'step_name'    => 'required|string|max:255',
            'role_id'      => 'nullable|exists:roles,id',
            'expected_days'=> 'nullable|integer|min:1',
            'has_digital_signature' => 'nullable|boolean',
        ]);

        try {
            DB::table('workflow_steps')->where('id', $stepId)->where('workflow_id', $workflowId)->update([
                'step_name'            => $request->step_name,
                'role_id_assigned'     => $request->role_id ?: null,
                'expected_days'        => $request->expected_days ?? 1,
                'has_digital_signature'=> $request->has_digital_signature ?? false,
            ]);
            return response()->json(['success' => true, 'message' => 'Cập nhật bước duyệt thành công']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function deleteStep(Request $request, $workflowId, $stepId)
    {
        if (!$this->isAdmin($request)) return response()->json(['error' => 'Quyền truy cập bị từ chối'], 403);

        try {
            DB::table('workflow_steps')->where('id', $stepId)->where('workflow_id', $workflowId)->delete();

            // Re-number remaining steps
            $steps = DB::table('workflow_steps')
                ->where('workflow_id', $workflowId)
                ->orderBy('sort_order')
                ->get();

            foreach ($steps as $i => $s) {
                DB::table('workflow_steps')->where('id', $s->id)->update(['sort_order' => $i + 1]);
            }

            return response()->json(['success' => true, 'message' => 'Đã xóa bước duyệt']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function reorderSteps(Request $request, $workflowId)
    {
        if (!$this->isAdmin($request)) return response()->json(['error' => 'Quyền truy cập bị từ chối'], 403);

        $request->validate([
            'order' => 'required|array',
            'order.*' => 'integer',
        ]);

        try {
            foreach ($request->order as $index => $stepId) {
                DB::table('workflow_steps')
                    ->where('id', $stepId)
                    ->where('workflow_id', $workflowId)
                    ->update(['sort_order' => $index + 1]);
            }
            return response()->json(['success' => true, 'message' => 'Đã cập nhật thứ tự']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    // ===================================================================
    // QUẢN LÝ GÁN QUY TRÌNH VÀO TÀI LIỆU (WORKFLOW ASSIGNMENTS)
    // ===================================================================

    public function getWorkflowAssignments(Request $request, $workflowId)
    {
        if (!$this->isAdmin($request)) return response()->json(['error' => 'Quyền truy cập bị từ chối'], 403);

        $assignments = DB::table('workflow_assignments')
            ->where('workflow_id', $workflowId)
            ->leftJoin('document_types', 'workflow_assignments.document_type_id', '=', 'document_types.id')
            ->select('workflow_assignments.*', 'document_types.type_name', 'document_types.group_name')
            ->get();

        return response()->json(['success' => true, 'data' => $assignments]);
    }

    public function addWorkflowAssignment(Request $request, $workflowId)
    {
        if (!$this->isAdmin($request)) return response()->json(['error' => 'Quyền truy cập bị từ chối'], 403);

        $request->validate([
            'document_type_id'    => 'nullable|integer',
            'document_group_name' => 'nullable|string',
            'scope_type'          => 'required|in:global,project,category',
            'scope_id'            => 'nullable|integer',
        ]);

        $scopeId = $request->scope_type === 'global' ? 0 : ($request->scope_id ?? 0);
        $docTypeId = $request->document_type_id;
        $groupName = $request->document_group_name;

        // --- BƯỚC 1: XÁC ĐỊNH DANH SÁCH LOẠI TÀI LIỆU CẦN KIỂM TRA ---
        $targetDocTypeIds = [];
        if ($docTypeId) {
            $targetDocTypeIds[] = $docTypeId;
        } elseif ($groupName) {
            $targetDocTypeIds = DB::table('document_types')->where('group_name', $groupName)->pluck('id')->toArray();
        }

        if (empty($targetDocTypeIds)) {
            return response()->json(['error' => 'Không xác định được loại tài liệu mục tiêu'], 400);
        }

        // --- BƯỚC 2: LẤY DANH SÁCH ROLE CÓ TRONG QUY TRÌNH ---
        $requiredRoleIds = DB::table('workflow_steps')
            ->where('workflow_id', $workflowId)
            ->whereNotNull('role_id_assigned')
            ->pluck('role_id_assigned')
            ->unique()
            ->toArray();

        // --- BƯỚC 3: KIỂM TRA QUYỀN (STRICT VALIDATION) ---
        $missingPermissions = [];
        foreach ($requiredRoleIds as $rId) {
            $role = DB::table('roles')->where('id', $rId)->first();
            $isAdminRole = ($role && $role->name === 'admin');

            foreach ($targetDocTypeIds as $dtId) {
                $hasPerm = $isAdminRole || DB::table('workflow_project_approvers')
                    ->where('role_id', $rId)
                    ->where('document_type_id', $dtId)
                    ->where('scope_type', $request->scope_type)
                    ->where('scope_id', $scopeId)
                    ->exists();

                if (!$hasPerm) {
                    $roleName = DB::table('roles')->where('id', $rId)->value('name') ?? "ID: $rId";
                    $docTypeName = DB::table('document_types')->where('id', $dtId)->value('type_name') ?? "ID: $dtId";
                    $missingPermissions[] = "Chức vụ [$roleName] chưa được cấp quyền duyệt loại [$docTypeName]";
                }
            }
        }

        if (!empty($missingPermissions)) {
            return response()->json([
                'error' => 'Thiếu quyền hạn duyệt hồ sơ',
                'details' => $missingPermissions
            ], 422);
        }

        // --- BƯỚC 4: THỰC HIỆN GÁN ---
        DB::table('workflow_assignments')
            ->where('document_type_id', $docTypeId)
            ->where('document_group_name', $groupName)
            ->where('scope_type', $request->scope_type)
            ->where('scope_id', $scopeId)
            ->delete();

        try {
            DB::table('workflow_assignments')->insert([
                'workflow_id'           => $workflowId,
                'document_type_id'      => $docTypeId,
                'document_group_name'   => $groupName,
                'scope_type'            => $request->scope_type,
                'scope_id'              => $scopeId,
                'assigned_by'           => $request->header('X-User-ID') ?? 1,
                'created_at'            => now(),
            ]);
            return response()->json(['success' => true, 'message' => 'Đã gán quy trình thành công']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function removeWorkflowAssignment(Request $request, $id)
    {
        if (!$this->isAdmin($request)) return response()->json(['error' => 'Quyền truy cập bị từ chối'], 403);

        try {
            DB::table('workflow_assignments')->where('id', $id)->delete();
            return response()->json(['success' => true, 'message' => 'Đã gỡ quy trình áp dụng']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
