<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Lấy dự án và "kéo" thêm thông tin danh mục, khách hàng để hiển thị lên thẻ
        $projects = Project::with(['category', 'customer'])->get();
        return response()->json($projects);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $project = Project::find($id);
        if (!$project) return response()->json(['message' => 'Không tìm thấy hồ sơ'], 404);

        // Frontend sẽ gửi lên { "status": "PROCESSING" } khi kéo thả
        $project->update($request->only(['status', 'priority', 'name', 'address']));

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật hồ sơ thành công',
            'data' => $project
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
