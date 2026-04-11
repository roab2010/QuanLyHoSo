<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\InventoryTransaction;
use App\Models\InventoryTransactionDetail;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function getProductList()
    {
        return response()->json(Product::all());
    }
    
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:import,export',
            'project_id' => $request->type === 'export' ? 'required|exists:projects,id' : 'nullable',
            'supplier_id' => 'nullable',
            'note' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|gt:0',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                // 1. Tạo đầu phiếu
                $transaction = InventoryTransaction::create([
                    // Thêm mã phiếu tự động để không bị lỗi thiếu field
                    'transaction_code' => ($request->type === 'import' ? 'PN-' : 'PX-') . strtoupper(uniqid()), 
                    'type' => $request->type === 'import' ? 'IN' : 'OUT',
                    'project_id' => $request->project_id,
                    'supplier_id' => $request->supplier_id,
                    
                    // SỬA TÊN CỘT TỪ user_id THÀNH created_by
                    'created_by' => auth()->id() ?? 1, 
                    
                    'transaction_date' => now(),
                    'note' => $request->note,
                    'status' => 'completed' // Đảm bảo có trạng thái
                ]);

                foreach ($request->items as $item) {
                    // Lock dòng này để tránh xung đột khi nhiều người cùng nhập/xuất
                    $product = Product::lockForUpdate()->find($item['product_id']);
                    
                    if ($request->type === 'import') {
                        $product->current_stock += $item['quantity'];
                    } else {
                        if ($product->current_stock < $item['quantity']) {
                            throw new \Exception("Vật tư [{$product->name}] không đủ tồn (Còn: {$product->current_stock})");
                        }
                        $product->current_stock -= $item['quantity'];
                    }
                    $product->save();

                    // 2. Lưu chi tiết phiếu
                    InventoryTransactionDetail::create([
                        'transaction_id' => $transaction->id, // Đã sửa từ inventory_transaction_id thành transaction_id
                        'product_id'     => $item['product_id'],
                        'quantity'       => $item['quantity'],
                        'unit_price'     => $item['price'] ?? $product->price,
                        // Thêm luôn cột total_price cho đủ bộ
                    ]);
                }
                return response()->json(['message' => 'Lưu phiếu kho thành công!']);
            });
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}