<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\InventoryTransaction;
use App\Models\InventoryTransactionDetail;
use App\Models\Warehouse;
use App\Models\SupplierMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryController extends Controller
{
    public function index()
    {
        $products = Product::with('batches')->get();

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
                    'space_coefficient' => (float) ($p->space_coefficient ?? 1),
                    'batches'           => $p->batches->filter(fn($b) => $b->quantity > 0)->values(),
                ];
            })
        ]);
    }

    public function show($id)
    {
        try {
            $product = Product::with(['batches' => function($q) {
                $q->where('quantity', '>', 0)->orderBy('hsd', 'asc');
            }])->findOrFail($id);
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
            'sku'          => 'required|regex:/^VT\-/i',
            'name'         => ['required', 'string', 'min:3', 'regex:/^[\p{L}\p{N}\s\-\(\),.\/]+$/u'],
            'warehouse_id' => 'required|exists:warehouses,id',
            'supplier_id'  => 'required|exists:suppliers,id',
            'current_stock'=> 'required|numeric|min:0.01',
            'price'        => 'nullable|numeric|min:0',
            'hsd'          => 'nullable|date|after_or_equal:today',
        ], [
            'sku.regex' => 'Mã vật tư phải bắt đầu bằng VT-',
            'current_stock.min' => 'Số lượng nhập phải lớn hơn 0',
            'price.min' => 'Giá nhập không được âm',
            'hsd.after_or_equal' => 'Hạn sử dụng không được là ngày trong quá khứ',
            'name.regex' => 'Tên vật tư chỉ được chứa chữ, số và các ký tự: - ( ) , . /',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                // 1. Kiểm tra Nhà cung cấp có đang hoạt động không
                $supplier = \App\Models\Supplier::findOrFail($request->supplier_id);
                if ($supplier->status !== 'ACTIVE') {
                    throw new Exception("Nhà cung cấp '{$supplier->name}' đang bị tạm dừng hợp tác!");
                }

                // --- KIỂM TRA TÊN VẬT TƯ TRONG BÁO GIÁ NCC (Cho vật tư mới) ---
                $skuExists = Product::where('sku', $request->sku)->exists();
                if (!$skuExists) {
                    $materialInQuote = SupplierMaterial::where('supplier_id', $request->supplier_id)
                        ->where('material_name', $request->name)
                        ->exists();
                    
                    if (!$materialInQuote) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'name' => ["Tên vật tư này chưa có trong báo giá của NCC '{$supplier->name}'."]
                        ]);
                    }
                }

                // 2. Kiểm tra tính nhất quán SKU trên toàn hệ thống (Global SKU Consistency)
                $anyExistingProduct = Product::where('sku', $request->sku)->first();
                if ($anyExistingProduct) {
                    if (trim(mb_strtolower($anyExistingProduct->name)) !== trim(mb_strtolower($request->name))) {
                        throw new Exception("Mã SKU '{$request->sku}' đã tồn tại với tên khác: '{$anyExistingProduct->name}'. Vui lòng nhập đúng tên để đồng bộ.");
                    }
                    if ($anyExistingProduct->unit !== $request->unit) {
                        throw new Exception("Mã SKU '{$request->sku}' đã tồn tại với đơn vị tính khác: '{$anyExistingProduct->unit}'. Vui lòng đồng bộ đơn vị tính.");
                    }
                    // Khóa giá: Phải khớp với giá hiện tại của SKU này
                    if ((float)$anyExistingProduct->price !== (float)$request->price) {
                        $fmtPrice = number_format($anyExistingProduct->price, 0, ',', '.');
                        throw new Exception("Mã SKU '{$request->sku}' đã được thiết lập giá cố định là {$fmtPrice}đ. Vui lòng không thay đổi giá tại đây (Sử dụng module NCC để cập nhật giá mới).");
                    }
                }

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
                    $existingProduct->save();
                    
                    // Xử lý tạo Lô hàng (Batch)
                    $batchHsd = $request->hsd ?: null;
                    $existingBatch = $existingProduct->batches()->where('hsd', $batchHsd)->first();
                    if ($existingBatch) {
                        $existingBatch->quantity += $newQty;
                        $existingBatch->save();
                    } else {
                        $existingProduct->batches()->create([
                            'hsd' => $batchHsd,
                            'quantity' => $newQty,
                        ]);
                    }

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
                    // --- Tạo mới sản phẩm hoàn toàn ---
                    $product = Product::create([
                        'sku'               => $request->sku,
                        'name'              => $request->name,
                        'unit'              => $request->unit ?? 'Cái',
                        'current_stock'     => $newQty,
                        'min_stock_level'   => $request->min_stock_level ?? 10,
                        'price'             => $request->price ?? 0,
                        'type'              => $request->type ?? 'CONSUMABLE',
                        'category_name'     => $request->category_name ?? '',
                        'warehouse_id'      => $request->warehouse_id,
                        'supplier_id'       => $request->supplier_id,
                        'space_coefficient' => $spaceCoef,
                    ]);

                    $product->batches()->create([
                        'hsd' => $request->hsd ?: null,
                        'quantity' => $newQty,
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
            'status'       => 'nullable|in:COMPLETED,PENDING',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $exportType = $request->export_type;
                $destWhId   = $request->destination_warehouse_id;
                $projectId  = $request->project_id;
                $status     = $request->status ?? 'COMPLETED';

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
                    'status'           => $status,
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

                    $transferredBatches = [];

                    if ($status === 'COMPLETED') {
                        // Trừ tồn kho nguồn
                        $p->current_stock = $p->current_stock - $qty;
                        $p->save();

                        // --- Thuật toán FIFO: Khấu trừ dần ở các Batch chứa HSD cũ ---
                        $remainingQtyToDeduct = $qty;
                        $batches = $p->batches()->where('quantity', '>', 0)->get()->sortBy(function($b) {
                            return $b->hsd ? $b->hsd : '9999-12-31'; 
                        });

                        foreach ($batches as $batch) {
                            if ($remainingQtyToDeduct <= 0) break;

                            $deduct = min($remainingQtyToDeduct, $batch->quantity);
                            $batch->quantity -= $deduct;
                            $batch->save();

                            $transferredBatches[] = [
                                'hsd' => $batch->hsd,
                                'quantity' => $deduct,
                            ];

                            $remainingQtyToDeduct -= $deduct;
                        }
                    }

                    // Nếu xuất sang kho khác: tìm sản phẩm cùng SKU tại kho đích và cộng vào hoặc tạo mới
                    if ($exportType === 'TO_WAREHOUSE') {
                        $destProduct = Product::where('sku', $p->sku)
                            ->where('warehouse_id', $destWhId)
                            ->first();

                        if ($destProduct) {
                            $destProduct->current_stock += $qty;
                            $destProduct->save();
                            
                            foreach ($transferredBatches as $tb) {
                                $existingBatch = $destProduct->batches()->where('hsd', $tb['hsd'])->first();
                                if ($existingBatch) {
                                    $existingBatch->quantity += $tb['quantity'];
                                    $existingBatch->save();
                                } else {
                                    $destProduct->batches()->create([
                                        'hsd' => $tb['hsd'],
                                        'quantity' => $tb['quantity'],
                                    ]);
                                }
                            }
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
                                'space_coefficient' => $p->space_coefficient,
                            ]);
                            
                            foreach ($transferredBatches as $tb) {
                                $destProduct->batches()->create([
                                    'hsd' => $tb['hsd'],
                                    'quantity' => $tb['quantity'],
                                ]);
                            }
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
     * Lấy danh sách các yêu cầu vật tư đang chờ duyệt
     */
    public function getPendingRequests()
    {
        $requests = InventoryTransaction::where('inventory_transactions.type', 'OUT')
            ->where('inventory_transactions.status', 'PENDING')
            ->with(['details.product', 'warehouse'])
            ->leftJoin('projects', 'inventory_transactions.project_id', '=', 'projects.id')
            ->select('inventory_transactions.*', 'projects.name as project_name')
            ->orderBy('inventory_transactions.created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'requests' => $requests]);
    }

    /**
     * Duyệt hoặc từ chối phiếu yêu cầu vật tư
     */
    public function processRequest(Request $request, $id)
    {
        $request->validate([
            'action' => 'required|in:APPROVE,REJECT'
        ]);

        try {
            return DB::transaction(function () use ($request, $id) {
                $transaction = InventoryTransaction::with('details.product')->findOrFail($id);

                if ($transaction->status !== 'PENDING') {
                    throw new Exception('Phiếu yêu cầu không còn ở trạng thái chờ duyệt!');
                }

                if ($request->action === 'REJECT') {
                    $transaction->status = 'REJECTED';
                    $transaction->save();
                    
                    \App\Models\SystemAuditLog::log(
                        'inventory',
                        'REJECT_OUT',
                        'inventory_transactions',
                        $transaction->id,
                        ['status' => 'PENDING'],
                        ['status' => 'REJECTED']
                    );
                    
                    return response()->json(['success' => true, 'message' => 'Đã từ chối phiếu yêu cầu!']);
                }

                // APPROVE logic
                foreach ($transaction->details as $detail) {
                    $p = $detail->product;
                    $qty = (float) $detail->quantity;

                    if ((float) $p->current_stock < $qty) {
                        throw new Exception("Vật tư '{$p->name}' không đủ tồn kho để duyệt! Hiện còn: {$p->current_stock}");
                    }

                    $p->current_stock = $p->current_stock - $qty;
                    $p->save();

                    // Thuật toán FIFO
                    $remainingQtyToDeduct = $qty;
                    $batches = $p->batches()->where('quantity', '>', 0)->get()->sortBy(function($b) {
                        return $b->hsd ? $b->hsd : '9999-12-31';
                    });

                    foreach ($batches as $batch) {
                        if ($remainingQtyToDeduct <= 0) break;
                        $deduct = min($remainingQtyToDeduct, $batch->quantity);
                        $batch->quantity -= $deduct;
                        $batch->save();
                        $remainingQtyToDeduct -= $deduct;
                    }
                }

                $transaction->status = 'COMPLETED';
                $transaction->save();

                \App\Models\SystemAuditLog::log(
                    'inventory',
                    'APPROVE_OUT',
                    'inventory_transactions',
                    $transaction->id,
                    ['status' => 'PENDING'],
                    ['status' => 'COMPLETED']
                );

                return response()->json(['success' => true, 'message' => 'Duyệt phiếu yêu cầu thành công!']);
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
        $isClosed = DB::table('projects')->where('id', $projectId)->value('is_return_closed');
        if ($isClosed) {
            return response()->json(['success' => true, 'items' => []]);
        }
        
        // Lấy tất cả chi tiết xuất (OUT) đã hoàn tất (COMPLETED) cho dự án này
        $exported = InventoryTransactionDetail::whereHas('transaction', function ($q) use ($projectId) {
                $q->where('type', 'OUT')->where('project_id', $projectId)->where('status', 'COMPLETED');
            })
            ->with('product')
            ->get()
            ->groupBy('product_id');

        // Lấy tất cả chi tiết đã nhập trả lại (IN) đã hoàn tất (COMPLETED) từ dự án này
        $returned = InventoryTransactionDetail::whereHas('transaction', function ($q) use ($projectId) {
                $q->where('type', 'IN')->where('project_id', $projectId)->where('status', 'COMPLETED');
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
                    'type'         => $product ? $product->type : 'CONSUMABLE',
                    'price'        => $product ? (float) $product->price : 0,
                    'space_coefficient' => $product ? (float) ($product->space_coefficient ?? 1) : 1,
                    'qty_at_project'    => round($remaining, 2),
                ];
            }
        }

        return response()->json(['success' => true, 'items' => $result]);
    }

    /**
     * Lấy lịch sử giao dịch vật tư (Xuất/Trả) của dự án
     */
    public function getProjectHistory($projectId)
    {
        try {
            $history = InventoryTransaction::where('project_id', $projectId)
                ->whereIn('status', ['COMPLETED', 'REJECTED'])
                ->with(['details.product'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'history' => $history
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Nhập hàng trả lại từ dự án về kho
     */
    public function importFromProject(Request $request)
    {
        $request->validate([
            'project_id'       => 'required',
            'warehouse_id'     => 'required|exists:warehouses,id',
            'items'            => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|numeric|min:0.01',
            'is_final_return'  => 'nullable|boolean',
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

                // --- KIỂM TRA GIỚI HẠN SỐ LƯỢNG THU HỒI ---
                // Lấy tổng tất cả chi tiết xuất (OUT) và đã trả (IN) ĐÃ HOÀN TẤT của dự án này để tính số dư
                $exportedMap = InventoryTransactionDetail::whereHas('transaction', function ($q) use ($request) {
                        $q->where('type', 'OUT')
                          ->where('project_id', $request->project_id)
                          ->where('status', 'COMPLETED');
                    })->get()->groupBy('product_id');

                $returnedMap = InventoryTransactionDetail::whereHas('transaction', function ($q) use ($request) {
                        $q->where('type', 'IN')
                          ->where('project_id', $request->project_id)
                          ->where('status', 'COMPLETED');
                    })->get()->groupBy('product_id');

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

                    // Tính số lượng thực tế dự án đang giữ
                    $totalExp = isset($exportedMap[$p->id]) ? $exportedMap[$p->id]->sum('quantity') : 0;
                    $totalRet = isset($returnedMap[$p->id]) ? $returnedMap[$p->id]->sum('quantity') : 0;
                    $available = round($totalExp - $totalRet, 2);

                    if ($qty > $available) {
                        throw new Exception("Vật tư '{$p->name}' tại dự án chỉ còn giữ {$available} {$p->unit}, không thể nhập trả {$qty}!");
                    }

                    // Cộng lại tồn kho (có thể chuyển về kho khác)
                    $p->current_stock += $qty;
                    $p->warehouse_id   = $request->warehouse_id;
                    $p->save();

                    // Tạo lô hàng (hsd null cho hàng trả về vì không xác định được đích xác lô nào)
                    $existingBatch = $p->batches()->whereNull('hsd')->first();
                    if ($existingBatch) {
                        $existingBatch->quantity += $qty;
                        $existingBatch->save();
                    } else {
                        $p->batches()->create([
                            'hsd' => null,
                            'quantity' => $qty,
                        ]);
                    }

                    $transaction->details()->create([
                        'product_id' => $p->id,
                        'quantity'   => $qty,
                        'unit_price' => (float) $p->price,
                    ]);
                }

                // Chốt sổ: Khấu trừ phần dư thừa (hao hụt thi công)
                if ($request->is_final_return) {
                    $projectModel = \App\Models\Project::find($request->project_id);
                    if ($projectModel) {
                        $projectModel->is_return_closed = true;
                        $projectModel->save();
                    }

                    // Tính lại dư nợ tương tự getProjectExportedItems (Chỉ tính hàng đã DUYỆT)
                    $exported = InventoryTransactionDetail::whereHas('transaction', function ($q) use ($request) {
                            $q->where('type', 'OUT')
                              ->where('project_id', $request->project_id)
                              ->where('status', 'COMPLETED');
                        })->get()->groupBy('product_id');

                    $returned = InventoryTransactionDetail::whereHas('transaction', function ($q) use ($request) {
                            $q->where('type', 'IN')
                              ->where('project_id', $request->project_id)
                              ->where('status', 'COMPLETED');
                        })->get()->groupBy('product_id');

                    $lossItems = [];
                    foreach ($exported as $productId => $details) {
                        $totalExported = $details->sum('quantity');
                        $totalReturned = isset($returned[$productId]) ? $returned[$productId]->sum('quantity') : 0;
                        $remaining     = $totalExported - $totalReturned;
                        if ($remaining > 0) {
                            $lossItems[] = [
                                'product_id' => $productId,
                                'quantity' => $remaining,
                                'price' => $details->first()->unit_price ?? 0,
                            ];
                        }
                    }

                    if (count($lossItems) > 0) {
                        $lossTransaction = InventoryTransaction::create([
                            'transaction_code' => 'P-LOSS-' . strtoupper(bin2hex(random_bytes(3))),
                            'type'             => 'OUT',
                            'project_id'       => $request->project_id,
                            'warehouse_id'     => $request->warehouse_id, // Gán tạm để đủ pass schema
                            'transaction_date' => now(),
                            'status'           => 'COMPLETED',
                            'note'             => 'Quyết toán hao hụt khi đóng dự án #' . $request->project_id,
                        ]);

                        foreach ($lossItems as $lItem) {
                            $lossTransaction->details()->create([
                                'product_id' => $lItem['product_id'],
                                'quantity'   => $lItem['quantity'],
                                'unit_price' => $lItem['price'],
                            ]);
                        }
                    }
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