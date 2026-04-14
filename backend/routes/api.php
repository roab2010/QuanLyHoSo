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

// AUTH ROUTES
Route::post('/login', [AuthController::class, 'loginCustomer']); // Khách hàng đăng nhập (email)
Route::post('/admin/login', [AuthController::class, 'loginAdmin']); // Admin/Staff đăng nhập (username)
Route::post('/admin/profile/{id}', [AuthController::class, 'updateProfile']);

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
Route::post('/projects/{projectId}/members', [ProjectController::class, 'addMember']);
Route::delete('/projects/{projectId}/members/{memberId}', [ProjectController::class, 'removeMember']);

// TÀI LIỆU DỰ ÁN (PROJECT DOCUMENTS)
Route::put('/projects/{projectId}/documents/{docId}', [ProjectController::class, 'updateDocument']);

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

// KHÁCH HÀNG (Admin chọn khi thêm hồ sơ)
Route::get('/customers', [CustomerController::class, 'index']);

// TIN TỨC
Route::get('/news', [NewsController::class, 'index']);

// KHO & VẬT TƯ
use App\Http\Controllers\WarehouseController;
Route::get('/warehouses', [WarehouseController::class, 'index']);
Route::get('/inventory', [InventoryController::class, 'index']);
Route::get('/products/{id}', [InventoryController::class, 'show']);
Route::post('/products', [InventoryController::class, 'store']);
Route::delete('/products/{id}', [InventoryController::class, 'destroy']);

Route::get('/suppliers', [SupplierController::class, 'index']);
Route::post('/suppliers', [SupplierController::class, 'store']);
Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);

// KHÁCH HÀNG (PORTAL)
Route::get('/customer/projects', [CustomerController::class, 'list']);
Route::get('/customer/projects/{id}', [CustomerController::class, 'detail']);
Route::post('/customer/profile/{id}', [CustomerController::class, 'updateProfile']);
