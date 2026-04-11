<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Supplier;

class SupplierController extends Controller
{
    // Lấy danh sách
    public function index()
    {
        return response()->json(Supplier::orderBy('is_strategic', 'desc')->orderBy('id', 'desc')->get());
    }

    // Thêm mới (Cho phép nhập mã)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_code'      => 'required|unique:suppliers',
            'name'               => 'required|string',
            'tax_code'           => 'nullable|string',
            'main_material_type' => 'nullable|string',
            'phone'              => 'nullable|string',
            'email'              => 'nullable|email',
            'status'             => 'required|in:active,paused',
            'is_strategic'       => 'boolean',
            'rating_stars'       => 'nullable|integer|min:1|max:5',
            'evaluation_tag'     => 'nullable|string'
        ]);

        $supplier = Supplier::create($validated);
        return response()->json(['message' => 'Thêm thành công', 'data' => $supplier], 201);
    }

    // Cập nhật (Khóa mã, cho sửa Rating & Status)
    public function update(Request $request, $id)
    {
        // SupplierController.php
        if (isset($validated['rating_stars'])) {
            $stars = $validated['rating_stars'];
            if ($stars >= 5) $validated['evaluation_tag'] = "TIN_CAY";
            elseif ($stars >= 3) $validated['evaluation_tag'] = "TIEM_NANG";
            else $validated['evaluation_tag'] = "CAN_XEM_XET";
        }
        $supplier = Supplier::findOrFail($id);
        
        $validated = $request->validate([
            'name'               => 'sometimes|required|string',
            'tax_code'           => 'nullable|string',
            'main_material_type' => 'nullable|string',
            'phone'              => 'nullable|string',
            'email'              => 'nullable|email',
            'status'             => 'required|in:ACTIVE,SUSPENDED,PENDING',
            'is_strategic'       => 'boolean',
            'rating_stars'       => 'nullable|integer|min:1|max:5',
            'evaluation_tag'     => 'nullable|in:TIN_CAY,TIEM_NANG,CAN_XEM_SET'
        ]);

        // Tuyệt đối không cập nhật supplier_code
        unset($validated['supplier_code']);

        $supplier->update($validated);
        return response()->json(['message' => 'Cập nhật thành công', 'data' => $supplier]);
    }

    // Xóa
    public function destroy($id)
    {
        Supplier::destroy($id);
        return response()->json(['message' => 'Đã xóa']);
    }
}