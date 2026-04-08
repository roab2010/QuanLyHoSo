<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProjectController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Các route cho Category
Route::apiResource('categories', CategoryController::class);

// Xử lý riêng cho Project (Viết Route PUT đè lên trước Resource)
Route::put('projects/{id}', [ProjectController::class, 'update']); 
Route::apiResource('projects', ProjectController::class);