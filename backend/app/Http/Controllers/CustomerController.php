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

        public function store(Request $request) 
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'email'     => 'required|email|unique:customers,email',
            'phone'     => 'nullable|string|max:20',
            'address'   => 'nullable|string|max:500', // Validate địa chỉ
            'password'  => 'required|string|min:6',    // Bắt buộc nhập mật khẩu khi tạo mới
        ]);

        // Tạo mã khách hàng tự động (như bạn đã làm)
        $customerCode = 'KH' . strtoupper(substr(uniqid(), 7));

        $customer = Customer::create([
            'customer_code' => $customerCode,
            'full_name'     => $request->full_name,
            'email'         => $request->email,
            'phone'         => $request->phone,
            'address'       => $request->address,      // Lưu địa chỉ
            'password'      => bcrypt($request->password), // Mã hóa mật khẩu admin nhập
            'status'        => 1,
        ]);

        return response()->json([
            'status' => 'success',
            'data'   => $customer
        ]);
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
            'phone'     => 'nullable|string|max:20',
            'email'     => 'required|email|unique:customers,email,' . $id,
            'address'   => 'nullable|string|max:500',
            'password'  => 'nullable|string|min:6', // Không bắt buộc khi sửa
        ]);

        $updateData = [
            'full_name' => $request->full_name,
            'phone'     => $request->phone,
            'email'     => $request->email,
            'address'   => $request->address, // Cập nhật địa chỉ
        ];

        // Kiểm tra nếu admin có điền mật khẩu mới vào ô nhập
        if ($request->filled('password')) {
            $updateData['password'] = bcrypt($request->password);
        }

        $customer->update($updateData);

        return response()->json([
            'status' => 'success', 
            'message' => 'Cập nhật thành công'
        ]);
    }
}