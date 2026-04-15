<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\InventoryTransaction;
use App\Models\InventoryTransactionDetail;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryController extends Controller
{
    public function index()
    {
        $products = Product::all();

        $stats = [
            'total_types'  => $products->count(),
            'low_stock'    => $products->filter(fn($p) => $p->current_stock <= $p->min_stock_level && $p->current_stock > 0)->count(),
            'out_of_stock' => $products->where('current_stock', '<=', 0)->count(),
            'total_value'  => (float) $products->sum(fn($p) => $p->current_stock * $p->price)
        ];

        return response()->json([
            'stats' => $stats,
            'inventory' => $products->map(function ($p) {
                return [
                    'id'                => $p->id,
                    'name'              => $p->name,
                    'sku'               => $p->sku,
                    'code'              => $p->sku,
                    'unit'              => $p->unit,
                    'quantity'          => (float) $p->current_stock,
                    'current_stock'     => (float) $p->current_stock,
                    'min_stock_level'   => (float) $p->min_stock_level,
                    'minStock'          => (float) $p->min_stock_level,
                    'price'             => (float) $p->price,
                    'status'            => $p->stock_status,
                    'type'              => $p->type,
                    'category_name'     => $p->category_name,
                    'warehouse_id'      => $p->warehouse_id,
                    'created_at'        => $p->created_at,
                    'hsd'               => $p->hsd,
                    'space_coefficient' => (float) ($p->space_coefficient ?? 1),
                ];
            })
        ]);
    }

    public function show($id)
    {
        try {
            $product = Product::findOrFail($id);
            $warehouse = Warehouse::find($product->warehouse_id);
            if ($warehouse) {
                $product->warehouse_name = $warehouse->name;
            }

            $history = InventoryTransactionDetail::with(['transaction', 'transaction.supplier'])
                ->where('product_id', $id)
                ->get()
                ->map(function ($detail) {
                    $transaction = $detail->transaction;
                    $label = 'N/A';
                    if ($transaction) {
                        if ($transaction->supplier) {
                            $label = $transaction->supplier->name;
                        } elseif ($transaction->project_id) {
                            $label = 'Dự án #' . $transaction->project_id;
                        } else if ($transaction->note) {
                            $label = $transaction->note;
                        }
                    }
                    return [
                        'date'          => $transaction ? $transaction->transaction_date : null,
                        'type'          => $transaction ? $transaction->type : 'UNKNOWN',
                        'supplier_name' => $label,
                        'quantity'      => (float) $detail->quantity,
                        'note'          => $transaction ? $transaction->note : '',
                    ];
                });

            $history = $history->sortByDesc('date')->values()->all();

            return response()->json([
                'success' => true,
                'product' => $product,
                'history' => $history
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Lỗi: ' . $e->getMessage()], 404);
        }
    }

    public function destroy($id)
    {
        try {
            $item = Product::find($id);
            if (!$item) {
                return response()->json(['message' => 'Không tìm thấy vật tư!'], 404);
            }
            $item->delete();
            return response()->json(['message' => 'Đã ẩn vật tư thành công!'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Nhập kho: hàng mới từ NCC (hoặc cộng dồn nếu SKU đã tồn tại)
     */
    public function store(Request $request)
    {
        $request->validate([
            'sku'          => 'required',
            'name'         => 'required',
            'warehouse_id' => 'required|exists:warehouses,id',
            'supplier_id'  => 'required|exists:suppliers,id',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $warehouse   = Warehouse::findOrFail($request->warehouse_id);
                $capacity    = (float) $warehouse->capacity;
                $spaceCoef   = (float) ($request->space_coefficient ?? 1);
                $newQty      = (float) $request->current_stock;
                $newSpace    = $newQty * $spaceCoef;

                // Kiểm tra capacity kho (trừ đi product hiện tại nếu cùng SKU)
                $existingProduct = Product::where('sku', $request->sku)
                                          ->where('warehouse_id', $request->warehouse_id)
                                          ->first();

                $currentUsed = (float) Product::where('warehouse_id', $request->warehouse_id)
                    ->when($existingProduct, fn($q) => $q->where('id', '!=', $existingProduct->id))
                    ->sum(DB::raw('current_stock * COALESCE(space_coefficient, 1)'));

                if (($currentUsed + $newSpace) > $capacity) {
                    throw new Exception(
                        "Kho không đủ chỗ! Còn trống: " . round($capacity - $currentUsed, 2) .
                        " | Cần thêm: " . round($newSpace, 2)
                    );
                }

                if ($existingProduct) {
                    // --- Cộng dồn số lượng vào sản phẩm đã có ---
                    $existingProduct->current_stock = $existingProduct->current_stock + $newQty;
                    // Cập nhật kho nếu muốn nhập vào kho khác (tuỳ chọn)
                    $existingProduct->warehouse_id = $request->warehouse_id;
                    if ($request->hsd) $existingProduct->hsd = $request->hsd;
                    $existingProduct->save();

                    $transaction = InventoryTransaction::create([
                        'transaction_code' => 'PNK-' . strtoupper(bin2hex(random_bytes(3))),
                        'type'             => 'IN',
                        'supplier_id'      => $request->supplier_id,
                        'warehouse_id'     => $request->warehouse_id,
                        'transaction_date' => now(),
                        'status'           => 'COMPLETED',
                        'note'             => 'Nhập bổ sung (cộng dồn SKU)',
                    ]);

                    $transaction->details()->create([
                        'product_id' => $existingProduct->id,
                        'quantity'   => $newQty,
                        'unit_price' => (float) ($request->price ?? $existingProduct->price),
                    ]);

                    return response()->json([
                        'success' => true,
                        'merged'  => true,
                        'message' => "Đã cộng thêm {$newQty} vào SKU {$request->sku}!",
                        'product' => $existingProduct,
                    ]);
                } else {
                    // --- Tạo sản phẩm mới ---
                    $product = Product::create([
                        'sku'               => $request->sku,
                        'name'              => $request->name,
                        'unit'              => $request->unit,
                        'current_stock'     => $newQty,
                        'min_stock_level'   => $request->min_stock_level ?? 10,
                        'price'             => $request->price,
                        'type'              => $request->type ?? 'CONSUMABLE',
                        'category_name'     => $request->category_name,
                        'warehouse_id'      => $request->warehouse_id,
                        'hsd'               => $request->hsd,
                        'space_coefficient' => $spaceCoef,
                    ]);

                    $transaction = InventoryTransaction::create([
                        'transaction_code' => 'PNK-' . strtoupper(bin2hex(random_bytes(3))),
                        'type'             => 'IN',
                        'supplier_id'      => $request->supplier_id,
                        'warehouse_id'     => $request->warehouse_id,
                        'transaction_date' => now(),
                        'status'           => 'COMPLETED',
                    ]);

                    $transaction->details()->create([
                        'product_id' => $product->id,
                        'quantity'   => $newQty,
                        'unit_price' => (float) $request->price,
                    ]);

                    return response()->json([
                        'success' => true,
                        'merged'  => false,
                        'message' => 'Nhập kho thành công!',
                        'product' => $product,
                    ]);
                }
            });
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Xuất kho: sang kho khác hoặc cho dự án, nhiều vật tư cùng lúc
     */
    public function export(Request $request)
    {
        $request->validate([
            'export_type'  => 'required|in:TO_WAREHOUSE,TO_PROJECT',
            'items'        => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|numeric|min:0.01',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $exportType = $request->export_type;
                $destWhId   = $request->destination_warehouse_id;
                $projectId  = $request->project_id;

                // --- Kiểm tra capacity kho đích (nếu xuất sang kho khác) ---
                if ($exportType === 'TO_WAREHOUSE') {
                    if (!$destWhId) throw new Exception('Vui lòng chọn kho đích!');
                    $destWarehouse = Warehouse::findOrFail($destWhId);
                    $destCapacity  = (float) $destWarehouse->capacity;
                    $destUsed      = (float) Product::where('warehouse_id', $destWhId)
                        ->sum(DB::raw('current_stock * COALESCE(space_coefficient, 1)'));

                    $totalNewSpace = 0;
                    foreach ($request->items as $item) {
                        $p = Product::findOrFail($item['product_id']);
                        $totalNewSpace += (float) $item['quantity'] * (float) ($p->space_coefficient ?? 1);
                    }

                    if (($destUsed + $totalNewSpace) > $destCapacity) {
                        throw new Exception(
                            "Kho đích không đủ chỗ! Còn trống: " . round($destCapacity - $destUsed, 2) .
                            " | Cần: " . round($totalNewSpace, 2)
                        );
                    }
                } elseif ($exportType === 'TO_PROJECT') {
                    if (!$projectId) throw new Exception('Vui lòng chọn dự án!');
                }

                // --- Kiểm tra tồn kho từng vật tư ---
                foreach ($request->items as $item) {
                    $p = Product::findOrFail($item['product_id']);
                    if ((float) $p->current_stock < (float) $item['quantity']) {
                        throw new Exception("Vật tư '{$p->name}' không đủ tồn kho! Còn: {$p->current_stock}");
                    }
                }

                // --- Lấy warehouse_id nguồn (từ product đầu tiên) ---
                $firstProduct = Product::findOrFail($request->items[0]['product_id']);
                $sourceWhId   = $firstProduct->warehouse_id;
                
                $destWarehouseInfo = null;
                if ($exportType === 'TO_WAREHOUSE') {
                    $destWarehouseInfo = Warehouse::findOrFail($destWhId);
                }
                $sourceWarehouseInfo = Warehouse::findOrFail($sourceWhId);

                // --- Tạo phiếu xuất kho ---
                $transaction = InventoryTransaction::create([
                    'transaction_code' => 'PXK-' . strtoupper(bin2hex(random_bytes(3))),
                    'type'             => 'OUT',
                    'warehouse_id'     => $sourceWhId,
                    'project_id'       => $projectId ?? null,
                    'transaction_date' => now(),
                    'status'           => 'COMPLETED',
                    'note'             => $exportType === 'TO_WAREHOUSE' ? 'Chuyển sang: ' . $destWarehouseInfo->name : ($request->note ?? null),
                ]);

                // --- Tạo phiếu nhập kho đích nếu xuất sang kho khác ---
                $destTransaction = null;
                if ($exportType === 'TO_WAREHOUSE') {
                    $destTransaction = InventoryTransaction::create([
                        'transaction_code' => 'P-CHUYENKHO-' . strtoupper(bin2hex(random_bytes(3))),
                        'type'             => 'IN',
                        'warehouse_id'     => $destWhId,
                        'transaction_date' => now(),
                        'status'           => 'COMPLETED',
                        'note'             => 'Chuyển đến từ: ' . $sourceWarehouseInfo->name,
                    ]);
                }

                // --- Xử lý từng vật tư ---
                foreach ($request->items as $item) {
                    $p   = Product::findOrFail($item['product_id']);
                    $qty = (float) $item['quantity'];

                    // Trừ tồn kho nguồn
                    $p->current_stock = $p->current_stock - $qty;
                    $p->save();

                    // Nếu xuất sang kho khác: tìm sản phẩm cùng SKU tại kho đích và cộng vào hoặc tạo mới
                    if ($exportType === 'TO_WAREHOUSE') {
                        $destProduct = Product::where('sku', $p->sku)
                            ->where('warehouse_id', $destWhId)
                            ->first();

                        if ($destProduct) {
                            $destProduct->current_stock += $qty;
                            $destProduct->save();
                        } else {
                            // Tạo bản ghi mới cho sản phẩm ở kho đích
                            $destProduct = Product::create([
                                'sku'               => $p->sku,
                                'name'              => $p->name,
                                'unit'              => $p->unit,
                                'current_stock'     => $qty,
                                'min_stock_level'   => $p->min_stock_level,
                                'price'             => $p->price,
                                'type'              => $p->type,
                                'category_name'     => $p->category_name,
                                'warehouse_id'      => $destWhId,
                                'hsd'               => $p->hsd,
                                'space_coefficient' => $p->space_coefficient,
                            ]);
                        }

                        // Tạo chi tiết phiếu nhập cho kho đích
                        $destTransaction->details()->create([
                            'product_id' => $destProduct->id,
                            'quantity'   => $qty,
                            'unit_price' => (float) $p->price,
                        ]);
                    }

                    // Tạo chi tiết phiếu xuất
                    $transaction->details()->create([
                        'product_id' => $p->id,
                        'quantity'   => $qty,
                        'unit_price' => (float) $p->price,
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Xuất kho thành công!',
                ]);
            });
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Lấy danh sách vật tư đang ở dự án (đã xuất chưa thu hồi đủ)
     */
    public function getProjectExportedItems($projectId)
    {
        // Lấy tất cả chi tiết xuất (OUT) cho dự án này
        $exported = InventoryTransactionDetail::whereHas('transaction', function ($q) use ($projectId) {
                $q->where('type', 'OUT')->where('project_id', $projectId);
            })
            ->with('product')
            ->get()
            ->groupBy('product_id');

        // Lấy tất cả chi tiết đã nhập trả lại (IN) từ dự án này
        $returned = InventoryTransactionDetail::whereHas('transaction', function ($q) use ($projectId) {
                $q->where('type', 'IN')->where('project_id', $projectId);
            })
            ->get()
            ->groupBy('product_id');

        $result = [];
        foreach ($exported as $productId => $details) {
            $totalExported = $details->sum('quantity');
            $totalReturned = isset($returned[$productId]) ? $returned[$productId]->sum('quantity') : 0;
            $remaining     = $totalExported - $totalReturned;

            if ($remaining > 0) {
                $product  = $details->first()->product;
                $result[] = [
                    'product_id'   => $productId,
                    'product_name' => $product ? $product->name : 'N/A',
                    'sku'          => $product ? $product->sku : 'N/A',
                    'unit'         => $product ? $product->unit : '',
                    'price'        => $product ? (float) $product->price : 0,
                    'space_coefficient' => $product ? (float) ($product->space_coefficient ?? 1) : 1,
                    'qty_at_project'    => round($remaining, 2),
                ];
            }
        }

        return response()->json(['success' => true, 'items' => $result]);
    }

    /**
     * Nhập hàng trả lại từ dự án về kho
     */
    public function importFromProject(Request $request)
    {
        $request->validate([
            'project_id'   => 'required',
            'warehouse_id' => 'required|exists:warehouses,id',
            'items'        => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|numeric|min:0.01',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $warehouse = Warehouse::findOrFail($request->warehouse_id);
                $capacity  = (float) $warehouse->capacity;
                $used      = (float) Product::where('warehouse_id', $request->warehouse_id)
                    ->sum(DB::raw('current_stock * COALESCE(space_coefficient, 1)'));

                // Tính tổng space cần thêm
                $totalSpace = 0;
                foreach ($request->items as $item) {
                    $p = Product::findOrFail($item['product_id']);
                    $totalSpace += (float) $item['quantity'] * (float) ($p->space_coefficient ?? 1);
                }

                if (($used + $totalSpace) > $capacity) {
                    throw new Exception(
                        "Kho không đủ chỗ! Còn trống: " . round($capacity - $used, 2) .
                        " | Cần: " . round($totalSpace, 2)
                    );
                }

                // Tạo phiếu nhập trả về
                $transaction = InventoryTransaction::create([
                    'transaction_code' => 'PTK-' . strtoupper(bin2hex(random_bytes(3))),
                    'type'             => 'IN',
                    'project_id'       => $request->project_id,
                    'warehouse_id'     => $request->warehouse_id,
                    'transaction_date' => now(),
                    'status'           => 'COMPLETED',
                    'note'             => 'Trả hàng từ dự án #' . $request->project_id,
                ]);

                foreach ($request->items as $item) {
                    $p   = Product::findOrFail($item['product_id']);
                    $qty = (float) $item['quantity'];

                    // Cộng lại tồn kho (có thể chuyển về kho khác)
                    $p->current_stock += $qty;
                    $p->warehouse_id   = $request->warehouse_id;
                    $p->save();

                    $transaction->details()->create([
                        'product_id' => $p->id,
                        'quantity'   => $qty,
                        'unit_price' => (float) $p->price,
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Nhập trả hàng từ dự án thành công!',
                ]);
            });
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}