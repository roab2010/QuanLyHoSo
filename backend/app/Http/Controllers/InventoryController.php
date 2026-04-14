<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\InventoryTransaction;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryController extends Controller
{
    public function index()
    {
        // Lấy sản phẩm kèm theo thông tin kho lưu trữ
        $products = Product::all();
        
        $stats = [
            'total_types'  => $products->count(),
            'low_stock'    => $products->filter(fn($p) => $p->current_stock <= $p->min_stock_level && $p->current_stock > 0)->count(),
            'out_of_stock' => $products->where('current_stock', '<=', 0)->count(),
            'total_value'  => (float) $products->sum(fn($p) => $p->current_stock * $p->price)
        ];

        return response()->json([
            'stats' => $stats,
            'inventory' => $products->map(function($p) {
                return [
                    'id'            => $p->id,
                    'name'          => $p->name,
                    'code'          => $p->sku,
                    'unit'          => $p->unit,
                    'quantity'      => (float) $p->current_stock,
                    'minStock'      => (float) $p->min_stock_level,
                    'price'         => (float) $p->price,
                    'status'        => $p->stock_status,
                    'type'          => $p->type, 
                    'category_name' => $p->category_name,
                    'warehouse_id'  => $p->warehouse_id, // Cần trường này để React lọc
                    'created_at'    => $p->created_at // Thời gian nhập
                ];
            })
        ]);
    }

    // Thêm vào trong class InventoryController
    public function destroy($id)
    {
        try {
            $item = Product::find($id);

            if (!$item) {
                return response()->json(['message' => 'Không tìm thấy vật tư!'], 404);
            }

            // Laravel thấy Model có dùng SoftDeletes nên nó sẽ chỉ 
            // update cột deleted_at chứ không xóa hẳn hàng này.
            $item->delete(); 

            return response()->json(['message' => 'Đã ẩn vật tư thành công!'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'sku' => 'required|unique:products,sku',
            'name' => 'required',
            'warehouse_id' => 'required|exists:warehouses,id',
            'supplier_id' => 'required|exists:suppliers,id',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                // 1. Kiểm tra sức chứa kho
                $warehouse = Warehouse::findOrFail($request->warehouse_id);
                $capacity = (float) $warehouse->capacity;
                $currentUsed = Product::where('warehouse_id', $request->warehouse_id)->sum('current_stock');
                $newQuantity = (float) $request->current_stock;

                if (($currentUsed + $newQuantity) > $capacity) {
                    throw new Exception("Kho đã đầy! Còn trống: " . ($capacity - $currentUsed));
                }

                // 2. Tạo Product
                $product = Product::create([
                    'sku'             => $request->sku,
                    'name'            => $request->name,
                    'unit'            => $request->unit,
                    'current_stock'   => $request->current_stock,
                    'min_stock_level' => $request->min_stock_level,
                    'price'           => $request->price,
                    'type'            => $request->type,
                    'category_name'   => $request->category_name,
                    'warehouse_id'    => $request->warehouse_id,
                ]);

                // 3. TẠO TRANSACTION (Phần này ông đang thiếu nên nó không lưu)
                $transaction = InventoryTransaction::create([
                    'transaction_code' => 'PNK-' . strtoupper(bin2hex(random_bytes(3))),
                    'type'             => 'IN',
                    'supplier_id'      => $request->supplier_id,
                    'warehouse_id'     => $request->warehouse_id,
                    'transaction_date' => now(), // Hoặc $request->received_at nếu có
                    'status'           => 'COMPLETED',
                ]);

                // 4. TẠO CHI TIẾT TRANSACTION
                // Đảm bảo trong Model InventoryTransaction có function details()
                $transaction->details()->create([
                    'product_id' => $product->id,
                    'quantity'   => $request->current_stock,
                    'unit_price' => $request->price,
                ]);

                return response()->json([
                    'success' => true, 
                    'message' => 'Nhập kho và tạo giao dịch thành công!',
                    'product' => $product // Trả về để React cập nhật UI nhanh
                ]);
            });
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}