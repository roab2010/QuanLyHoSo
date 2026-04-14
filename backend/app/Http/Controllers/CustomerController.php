<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;

class CustomerController extends Controller
{
    // 📌 Danh sách hồ sơ theo khách hàng
    public function list(Request $request)
    {
        $customer_id = $request->customer_id;

        $data = Project::where('customer_id', $customer_id)->get();

        return response()->json($data);
    }

    // 📌 Chi tiết hồ sơ
    public function detail($id)
    {
        $data = Project::find($id);

        return response()->json($data);
    }
}