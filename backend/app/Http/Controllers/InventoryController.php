<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception; // Quan trọng để catch lỗi trong transaction

class InventoryController extends Controller
{
    public function index()
    {
        $products = Product::all();
        
        $stats = [
            'total_types'  => $products->count(),
            'low_stock'    => $products->filter(function($p) {
                return $p->current_stock <= $p->min_stock_level && $p->current_stock > 0;
            })->count(),
            'out_of_stock' => $products->where('current_stock', '<=', 0)->count(),
            'total_value'  => (float) $products->sum(fn($p) => $p->current_stock * $p->price)
        ];

        return response()->json([
            'stats' => $stats,
            'inventory' => $products->map(function($p) {
                return [
                    'id'        => $p->id,
                    'name'      => $p->name,
                    'code'      => $p->sku,
                    'unit'      => $p->unit,
                    'quantity'  => (float) $p->current_stock,
                    'minStock'  => (float) $p->min_stock_level,
                    'status'    => $p->stock_status, // Phải có $appends trong Model Product mới chạy được
                    'location'  => 'Kho chính'
                ];
            })
        ]);
    }
    public function storeTransaction(Request $request)
    {
        // Validate dữ liệu đầu vào để tránh lỗi bậy
        $request->validate([
            'type' => 'required|in:IN,OUT',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $subTotal = collect($request->items)->sum(function ($item) {
                    return $item['quantity'] * ($item['price'] ?? 0);
                });
                
                $taxAmount = $subTotal * ($request->tax_rate ?? 0);
                $grandTotal = $subTotal + $taxAmount;

                $transaction = InventoryTransaction::create([
                    'transaction_code' => 'TRX-' . strtoupper(bin2hex(random_bytes(4))),
                    'type'             => $request->type,
                    'supplier_id'      => $request->supplier_id,
                    'project_id'       => $request->project_id,
                    'created_by'       => auth()->id() ?? 1,
                    'transaction_date' => now(),
                    'note'             => $request->note,
                    'tax_amount'       => $taxAmount,
                    'grand_total'      => $grandTotal,
                    'attachment_url'   => $request->attachment_url,
                    'status'           => 'COMPLETED',
                ]);

                foreach ($request->items as $item) {
                    $lineTotal = $item['quantity'] * ($item['price'] ?? 0);

                    $transaction->details()->create([
                        'product_id'  => $item['product_id'],
                        'quantity'    => $item['quantity'],
                        'unit_price'  => $item['price'] ?? 0,
                        'total_price' => $lineTotal,
                    ]);

                    // Khóa dòng product để tránh tranh chấp dữ liệu (Race condition)
                    $product = Product::lockForUpdate()->find($item['product_id']); 
                    
                    if ($request->type === 'IN') {
                        $product->increment('current_stock', $item['quantity']);
                    } else {
                        if ($product->current_stock < $item['quantity']) {
                            throw new Exception("Sản phẩm {$product->name} hiện chỉ còn {$product->current_stock}, không đủ để xuất {$item['quantity']}!");
                        }
                        $product->decrement('current_stock', $item['quantity']);
                    }
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Giao dịch đã được lưu thành công!',
                    'code'    => $transaction->transaction_code
                ]);
            });
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
    public function store(Request $request)
    {
        try {
            // 1. Validate dữ liệu đầu vào
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'sku'  => 'required|string|unique:products,sku', // Mã vật tư không được trùng
                'unit' => 'required|string|max:50',
                'current_stock'   => 'required|numeric|min:0',
                'min_stock_level' => 'required|numeric|min:0',
                'price'           => 'required|numeric|min:0',
                'type'            => 'required|in:CONSUMABLE,RETURNABLE', // Chốt chặn ở đây
                'category_name'   => 'nullable|string',
            ]);

            // 2. Tạo mới sản phẩm/vật tư
            $product = Product::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Thêm vật tư mới thành công!',
                'data'    => $product
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ], 400);
        }
    }
}