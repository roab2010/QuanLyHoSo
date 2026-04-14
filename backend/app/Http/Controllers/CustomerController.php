<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\Customer;

class CustomerController extends Controller
{
    // 📌 Lấy danh sách toàn bộ khách hàng (Dùng cho Admin chọn khi thêm hồ sơ)
    public function index()
    {
        $customers = Customer::all();
        return response()->json([
            'status' => 'success',
            'data' => $customers
        ]);
    }

    // 📌 Danh sách hồ sơ theo khách hàng
    public function list(Request $request)
    {
        $customer_id = $request->customer_id;

        $data = Project::with('tasks')->where('customer_id', $customer_id)->get();

        return response()->json($data);
    }

    // 📌 Chi tiết hồ sơ
    public function detail($id)
    {
        // Lấy thông tin dự án cùng với danh sách công việc (tasks)
        $data = Project::with('tasks')->find($id);

        if (!$data) {
            return response()->json(['message' => 'Không tìm thấy hồ sơ'], 404);
        }

        return response()->json($data);
    }

    // 📌 Cập nhật hồ sơ khách hàng
    public function updateProfile(Request $request, $id)
    {
        $customer = Customer::find($id);
        if (!$customer) {
            return response()->json(['message' => 'Không tìm thấy khách hàng'], 404);
        }

        $request->validate([
            'full_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'required|email|unique:customers,email,' . $id,
        ]);

        $customer->update([
            'full_name' => $request->full_name,
            'phone' => $request->phone,
            'email' => $request->email,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật hồ sơ thành công',
            'user' => $customer
        ]);
    }
}