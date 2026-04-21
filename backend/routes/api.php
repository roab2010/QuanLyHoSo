<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\ProjectDocumentController;
use App\Http\Controllers\DocumentWorkflowController;
use App\Http\Controllers\SystemAuditLogController;

// SYSTEM AUDIT LOGS
Route::get('/audit-logs', [SystemAuditLogController::class, 'index']);

// AUTH ROUTES
Route::post('/login', [AuthController::class, 'loginCustomer']); // Khách hàng đăng nhập (email)
Route::post('/admin/login', [AuthController::class, 'loginAdmin']); // Admin/Staff đăng nhập (username)
Route::post('/admin/profile/{id}', [AuthController::class, 'updateProfile']);
Route::post('/admin/change-password/{id}', [AuthController::class, 'changePassword']);

// CÁC ROUTE CỦA DỰ ÁN (HỒ SƠ)
Route::get('/projects', [ProjectController::class, 'index']);
Route::get('/customer/projects/{customerId}', [ProjectController::class, 'getByCustomer']);
Route::get('/projects/{id}', [ProjectController::class, 'show']);
Route::post('/projects', [ProjectController::class, 'store']);
Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);
Route::put('/projects/{id}', [ProjectController::class, 'update']);
Route::patch('/projects/{id}/status', [ProjectController::class, 'updateStatus']);


// CÔNG VIỆC DỰ ÁN (PROJECT TASKS)

Route::post('/projects/{projectId}/tasks', [ProjectController::class, 'storeTask']);
Route::put('/projects/{projectId}/tasks/{taskId}', [ProjectController::class, 'updateTask']);
Route::delete('/projects/{projectId}/tasks/{taskId}', [ProjectController::class, 'destroyTask']);

// THÀNH VIÊN DỰ ÁN (PROJECT MEMBERS)
Route::get('/employees', [ProjectController::class, 'getEmployees']);
Route::get('/project-positions', [ProjectController::class, 'getProjectPositions']);
Route::post('/projects/{projectId}/members', [ProjectController::class, 'addMember']);
Route::delete('/projects/{projectId}/members/{memberId}', [ProjectController::class, 'removeMember']);

// TÀI LIỆU DỰ ÁN (PROJECT DOCUMENTS)
Route::get('/all-documents', [ProjectDocumentController::class, 'index']);
Route::get('/documents-metadata', [ProjectDocumentController::class, 'getMetadata']);
Route::get('/documents/download-file', [ProjectDocumentController::class, 'downloadFile']);
Route::get('/documents/view-file', [ProjectDocumentController::class, 'viewFile']);
Route::post('/documents/upload', [ProjectDocumentController::class, 'store']);
Route::post('/documents/{id}', [ProjectDocumentController::class, 'update']);
Route::delete('/documents/{id}', [ProjectDocumentController::class, 'destroy']);
Route::put('/projects/{projectId}/documents/{docId}', [ProjectController::class, 'updateDocument']);

// WORKFLOW DUYỆT TÀI LIỆU
Route::get('/workflow/pending-approvals', [DocumentWorkflowController::class, 'getPendingApprovals']);
Route::get('/workflow/all-documents', [DocumentWorkflowController::class, 'getAllDocuments']);
Route::get('/workflow/workflows', [DocumentWorkflowController::class, 'getWorkflows']);
Route::get('/workflow/document-types', [DocumentWorkflowController::class, 'getDocumentTypes']);
Route::post('/workflow/documents/{id}/approve', [DocumentWorkflowController::class, 'approve']);
Route::post('/workflow/documents/{id}/reject', [DocumentWorkflowController::class, 'reject']);
Route::post('/workflow/documents/{id}/revise', [DocumentWorkflowController::class, 'revise']);
Route::post('/workflow/documents/{id}/resubmit', [DocumentWorkflowController::class, 'resubmit']);
Route::get('/workflow/documents/{id}/logs', [DocumentWorkflowController::class, 'getWorkflowLogs']);

// QUẢN LÝ QUY TRÌNH (WORKFLOW MANAGEMENT - Admin only)
Route::post('/workflow/workflows', [DocumentWorkflowController::class, 'createWorkflow']);
Route::put('/workflow/workflows/{id}', [DocumentWorkflowController::class, 'updateWorkflow']);
Route::delete('/workflow/workflows/{id}', [DocumentWorkflowController::class, 'deleteWorkflow']);

// QUẢN LÝ BƯỚC DUYỆT (STEP MANAGEMENT - Admin only)
Route::post('/workflow/workflows/{workflowId}/steps', [DocumentWorkflowController::class, 'createStep']);
Route::put('/workflow/workflows/{workflowId}/steps/{stepId}', [DocumentWorkflowController::class, 'updateStep']);
Route::delete('/workflow/workflows/{workflowId}/steps/{stepId}', [DocumentWorkflowController::class, 'deleteStep']);
Route::post('/workflow/workflows/{workflowId}/steps/reorder', [DocumentWorkflowController::class, 'reorderSteps']);

// QUẢN LÝ GÁN QUY TRÌNH (WORKFLOW ASSIGNMENTS - Admin only)
Route::get('/workflow/workflows/{workflowId}/assignments', [DocumentWorkflowController::class, 'getWorkflowAssignments']);
Route::post('/workflow/workflows/{workflowId}/assignments', [DocumentWorkflowController::class, 'addWorkflowAssignment']);
Route::delete('/workflow/assignments/{id}', [DocumentWorkflowController::class, 'removeWorkflowAssignment']);

// PHÂN QUYỀN DUYỆT TÀI LIỆU
Route::get('/workflow/approvers', [DocumentWorkflowController::class, 'getApprovers']);
Route::post('/workflow/approvers', [DocumentWorkflowController::class, 'grantApprover']);
Route::delete('/workflow/approvers/{id}', [DocumentWorkflowController::class, 'revokeApprover']);


// DANH MỤC
Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/categories', [CategoryController::class, 'store']);
Route::put('/categories/{id}', [CategoryController::class, 'update']);
Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

// QUY TRÌNH MẪU (TEMPLATE TASKS)
use App\Http\Controllers\TemplateTaskController;

Route::get('/template-tasks/category/{categoryId}', [TemplateTaskController::class, 'index']);
Route::post('/template-tasks', [TemplateTaskController::class, 'store']);
Route::put('/template-tasks/{id}', [TemplateTaskController::class, 'update']);
Route::delete('/template-tasks/{id}', [TemplateTaskController::class, 'destroy']);

// TÀI LIỆU MẪU (TEMPLATE DOCUMENTS)
use App\Http\Controllers\TemplateDocumentController;

Route::get('/template-documents/category/{categoryId}', [TemplateDocumentController::class, 'index']);
Route::get('/document-types', [TemplateDocumentController::class, 'getDocumentTypes']);
Route::post('/template-documents', [TemplateDocumentController::class, 'store']);
Route::put('/template-documents/{id}', [TemplateDocumentController::class, 'update']);
Route::delete('/template-documents/{id}', [TemplateDocumentController::class, 'destroy']);

// KHÁCH HÀNG (Admin chọn khi thêm hồ sơ)
// Cấu trúc chuẩn cho nhóm Route khách hàng
// File: routes/api.php

// 📌 Route lấy danh sách (GET)
Route::get('/customers', [CustomerController::class, 'index']);
Route::post('/customers', [CustomerController::class, 'store']);
Route::post('/customer/profile/{id}', [CustomerController::class, 'updateProfile']);


// QUẢN LÝ NHÂN VIÊN & VAI TRÒ (Cấp phát tài khoản)
use App\Http\Controllers\EmployeeController;
    Route::get('/manage/employees', [EmployeeController::class, 'index']);
    Route::get('/manage/employees/{id}/projects', [EmployeeController::class, 'getEmployeeProjects']);
    Route::post('/manage/employees', [EmployeeController::class, 'store']);
    Route::put('/manage/employees/{id}', [EmployeeController::class, 'update']);
    Route::delete('/manage/employees/{id}', [EmployeeController::class, 'destroy']);
    Route::get('/roles', [EmployeeController::class, 'getRoles']);
Route::post('/roles', [EmployeeController::class, 'storeRole']);
Route::put('/roles/{id}', [EmployeeController::class, 'updateRole']);
Route::delete('/roles/{id}', [EmployeeController::class, 'destroyRole']);


// KHO & VẬT TƯ
use App\Http\Controllers\WarehouseController;

Route::get('/warehouses', [WarehouseController::class, 'index']);
Route::get('/inventory', [InventoryController::class, 'index']);
Route::get('/products/{id}', [InventoryController::class, 'show']);
Route::post('/products', [InventoryController::class, 'store']);
Route::delete('/products/{id}', [InventoryController::class, 'destroy']);
Route::get('/inventory/pending-requests', [InventoryController::class, 'getPendingRequests']);
Route::post('/inventory/requests/{id}/process', [InventoryController::class, 'processRequest']);

Route::post('/inventory/export', [InventoryController::class, 'export']);
Route::post('/inventory/import-from-project', [InventoryController::class, 'importFromProject']);
Route::get('/inventory/project-items/{projectId}', [InventoryController::class, 'getProjectExportedItems']);
Route::get('/inventory/project-history/{projectId}', [InventoryController::class, 'getProjectHistory']);

Route::get('/suppliers', [SupplierController::class, 'index']);
Route::post('/suppliers', [SupplierController::class, 'store']);
Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);
Route::post('/suppliers/{id}/materials', [SupplierController::class, 'addMaterial']);
Route::post('/suppliers/{id}/materials/bulk', [SupplierController::class, 'bulkAddMaterials']);
Route::put('/supplier-materials/{id}/price', [SupplierController::class, 'updatePrice']);
Route::get('/supplier-materials/{id}/history', [SupplierController::class, 'getPriceHistory']);
Route::delete('/supplier-materials/{id}', [SupplierController::class, 'deleteMaterial']);


// KHÁCH HÀNG (PORTAL)
Route::get('/customer/projects', [CustomerController::class, 'list']);
Route::get('/customer/projects/{id}', [CustomerController::class, 'detail']);
Route::post('/customer/profile/{id}', [CustomerController::class, 'updateProfile']);
Route::post('/customer/change-password/{id}', [CustomerController::class, 'changePassword']);
Route::post('/customer/projects/{projectId}/upload', [ProjectController::class, 'customerUploadDocument']);
Route::get('/news', [NewsController::class, 'index']);
Route::get('/crawl-news', [NewsController::class, 'crawl']);

// NHẬT KÝ THI CÔNG (CONSTRUCTION LOGS)
use App\Http\Controllers\ConstructionLogController;

Route::get('/projects/{projectId}/construction-logs', [ConstructionLogController::class, 'index']);
Route::post('/projects/{projectId}/construction-logs', [ConstructionLogController::class, 'store']);
Route::delete('/construction-logs/{logId}', [ConstructionLogController::class, 'destroy']);
Route::post('/construction-logs/{logId}/images', [ConstructionLogController::class, 'addImages']);
Route::delete('/construction-log-images/{imageId}', [ConstructionLogController::class, 'deleteImage']);
