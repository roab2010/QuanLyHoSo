<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProjectController;

Route::apiResource('categories', CategoryController::class);
Route::apiResource('projects', ProjectController::class);
