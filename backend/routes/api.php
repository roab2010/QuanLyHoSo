<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProjectController;

use Illuminate\Support\Facades\Cache;
use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;
use App\Http\Controllers\TemplateTaskController;

use App\Http\Controllers\InventoryController;

use App\Http\Controllers\SupplierController;

use App\Http\Controllers\NewsController;

use App\Http\Controllers\AuthController;

use App\Http\Controllers\CustomerController;


Route::get('/inventory', [InventoryController::class, 'index']);
Route::post('/products', [InventoryController::class, 'store']);
Route::post('/inventory/transaction', [InventoryController::class, 'storeTransaction']);
Route::delete('/products/{id}', [InventoryController::class, 'destroy']);

Route::get('/suppliers/stats', [SupplierController::class, 'getStats']); // Cho các thẻ thống kê
Route::apiResource('suppliers', SupplierController::class);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Các route cho Category
Route::apiResource('categories', CategoryController::class);

// Lấy danh sách: GET http://localhost:8000/api/template-tasks/category/1
Route::get('/template-tasks/category/{categoryId}', [TemplateTaskController::class, 'index']);

// Thêm mới: POST http://localhost:8000/api/template-tasks
Route::post('/template-tasks', [TemplateTaskController::class, 'store']);

// Cập nhật: PUT http://localhost:8000/api/template-tasks/1
Route::put('/template-tasks/{id}', [TemplateTaskController::class, 'update']);

// Xóa: DELETE http://localhost:8000/api/template-tasks/1
Route::delete('/template-tasks/{id}', [TemplateTaskController::class, 'destroy']);

// Xử lý riêng cho Project (Viết Route PUT đè lên trước Resource)
Route::put('projects/{id}', [ProjectController::class, 'update']);
Route::apiResource('projects', ProjectController::class);

//route xử lí customer
Route::get('/customers', [ProjectController::class, 'getCustomers']);

// Route cho nhân viên
Route::get('/employees', [ProjectController::class, 'getEmployees']);

// Route cho tasks (tiến độ thi công)
Route::post('/projects/{projectId}/tasks', [ProjectController::class, 'storeTask']);
Route::put('/projects/{projectId}/tasks/{taskId}', [ProjectController::class, 'updateTask']);
Route::delete('/projects/{projectId}/tasks/{taskId}', [ProjectController::class, 'destroyTask']);

// Route cho tài liệu
Route::put('/projects/{projectId}/documents/{docId}', [ProjectController::class, 'updateDocument']);

// Route cho thành viên
Route::post('/projects/{projectId}/members', [ProjectController::class, 'addMember']);
Route::delete('/projects/{projectId}/members/{memberId}', [ProjectController::class, 'removeMember']);

Route::get('/news', [NewsController::class, 'index']);
Route::get('/crawl-news', [NewsController::class, 'crawl']); // testRoute để cào tin tức từ VnExpress

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/customer/hoso', [CustomerController::class, 'getHoSo']);

Route::get('/customer/ho-so/{id}', [CustomerController::class, 'detail']);
Route::get('/customer/ho-so', [CustomerController::class, 'list']);