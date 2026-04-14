<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // ĐĂNG NHẬP KHÁCH HÀNG (Dùng Email)
    public function loginCustomer(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $customer = Customer::where('email', $request->email)->first();

        if (!$customer || !Hash::check($request->password, $customer->password)) {
            return response()->json(['message' => 'Sai email hoặc mật khẩu'], 401);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Chào mừng khách hàng trở lại',
            'user' => [
                'id' => $customer->id,
                'full_name' => $customer->full_name,
                'email' => $customer->email,
                'role' => 'customer'
            ]
        ]);
    }

    // ĐĂNG NHẬP ADMIN/NHÂN VIÊN (Dùng Username)
    public function loginAdmin(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $user = User::with('role')->where('username', $request->username)->first();

        // Kiểm tra mật khẩu (Sử dụng password_hash từ model User)
        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return response()->json(['message' => 'Sai tài khoản hoặc mật khẩu'], 401);
        }

        return response()->json([
            'message' => 'Đăng nhập hệ thống thành công',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'image' => $user->image,
                'role' => $user->role->name ?? 'staff'
            ]
        ]);
    }
    public function updateProfile(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/avatars'), $filename);
            $user->image = url('uploads/avatars/' . $filename);
        }

        if ($request->has('full_name')) {
            $user->full_name = $request->full_name;
        }

        if ($request->has('email')) {
            $user->email = $request->email;
        }

        $user->save();

        return response()->json([
            'message' => 'Cập nhật trang cá nhân thành công',
            'user' => $user
        ]);
    }
}
