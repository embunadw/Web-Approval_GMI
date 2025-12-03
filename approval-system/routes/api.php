<?php
// routes/api.php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MasterItemController;
use App\Http\Controllers\RequestController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Master Items
    Route::get('/master-items', [MasterItemController::class, 'index']);
    Route::get('/master-items/{id}', [MasterItemController::class, 'show']);
    Route::post('/master-items', [MasterItemController::class, 'store']);
    Route::post('/master-items/import', [MasterItemController::class, 'importExcel']);

    // Requests
    Route::get('/requests', [RequestController::class, 'index']);
    Route::get('/requests/{id}', [RequestController::class, 'show']);
    Route::post('/requests', [RequestController::class, 'store']);
    Route::post('/requests/{id}/approve', [RequestController::class, 'approve']);
    Route::post('/requests/{id}/reject', [RequestController::class, 'reject']);
});