<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Supplier;
use App\Models\SupplierMaterial;
use App\Models\SupplierPriceHistory;

class SupplierController extends Controller
{
    // Lấy danh sách
    public function index()
    {
        return response()->json(Supplier::with(['materials', 'materials.priceHistories' => function($q){
            $q->orderBy('changed_at', 'desc');
        }])->orderBy('is_strategic', 'desc')->orderBy('id', 'desc')->get());
    }

    // Thêm mới
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_code'      => 'required|unique:suppliers',
            'name'               => 'required|string',
            'tax_code'           => 'nullable|string',
            'phone'              => 'required|string',
            'email'              => 'nullable|email',
            'status'             => 'required|in:ACTIVE,SUSPENDED,PENDING',
            'is_strategic'       => 'boolean',
            'rating_stars'       => 'nullable|integer|min:1|max:5',
            'evaluation_tag'     => 'nullable|string'
        ]);

        // Materials: expected to be a comma-separated string or array
        $materialsStr = $request->input('materials_string');
        
        $supplier = Supplier::create($validated);

        // Process materials if provided
        if (!empty($materialsStr)) {
            $materialsArray = array_filter(array_map('trim', explode(',', $materialsStr)));
            foreach($materialsArray as $matName) {
                if(!empty($matName)) {
                    SupplierMaterial::create([
                        'supplier_id' => $supplier->id,
                        'material_name' => $matName,
                        'current_price' => 0
                    ]);
                }
            }
        }

        return response()->json(['message' => 'Thêm thành công', 'data' => $supplier->load('materials')], 201);
    }

    // Cập nhật
    public function update(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);
        
        $validated = $request->validate([
            'name'               => 'sometimes|required|string',
            'tax_code'           => 'nullable|string',
            'phone'              => 'required|string',
            'email'              => 'nullable|email',
            'status'             => 'required|in:ACTIVE,SUSPENDED,PENDING',
            'is_strategic'       => 'boolean',
            'rating_stars'       => 'nullable|integer|min:1|max:5',
            'evaluation_tag'     => 'nullable|string'
        ]);

        if (isset($validated['rating_stars'])) {
            $stars = $validated['rating_stars'];
            if ($stars >= 5) $validated['evaluation_tag'] = "TIN_CAY";
            elseif ($stars >= 3) $validated['evaluation_tag'] = "TIEM_NANG";
            else $validated['evaluation_tag'] = "CAN_XEM_SET";
        }

        unset($validated['supplier_code']);
        $supplier->update($validated);
        
        return response()->json(['message' => 'Cập nhật thành công', 'data' => $supplier->load('materials')]);
    }

    // Xóa
    public function destroy($id)
    {
        Supplier::destroy($id);
        return response()->json(['message' => 'Đã xóa']);
    }

    // --- MATERIAL & PRICE MANAGEMENT ---

    // Thêm vật tư mới cho nhà cung cấp
    public function addMaterial(Request $request, $supplierId)
    {
        $request->validate([
            'material_name' => 'required|string|max:150',
            'unit' => 'nullable|string|max:50',
            'current_price' => 'nullable|numeric|min:0'
        ]);

        $supplier = Supplier::findOrFail($supplierId);
        
        $material = SupplierMaterial::create([
            'supplier_id' => $supplier->id,
            'material_name' => $request->material_name,
            'unit' => $request->unit,
            'current_price' => $request->current_price ?? 0
        ]);

        // Nếu có giá ban đầu thì lưu vào lịch sử
        if ($material->current_price > 0) {
            SupplierPriceHistory::create([
                'supplier_material_id' => $material->id,
                'old_price' => 0,
                'new_price' => $material->current_price,
                'note' => 'Giá khởi tạo ban đầu',
            ]);
        }

        return response()->json(['message' => 'Đã thêm vật tư', 'data' => $material->load('priceHistories')]);
    }

    // Nhập vật tư / giá hàng loạt
    public function bulkAddMaterials(Request $request, $supplierId)
    {
        $request->validate([
            'materials' => 'required|array',
            'materials.*.material_name' => 'required|string|max:150',
            'materials.*.unit' => 'nullable|string|max:50',
            'materials.*.current_price' => 'nullable|numeric|min:0',
            'materials.*.changed_at' => 'nullable|date'
        ]);

        $supplier = Supplier::findOrFail($supplierId);
        $addedCount = 0;
        $updatedCount = 0;

        foreach ($request->materials as $matData) {
            $name = trim($matData['material_name']);
            if (empty($name)) continue;

            $unit = isset($matData['unit']) && !empty(trim($matData['unit'])) ? trim($matData['unit']) : 'Cái';
            $price = isset($matData['current_price']) ? floatval($matData['current_price']) : 0;
            $changedAt = isset($matData['changed_at']) ? $matData['changed_at'] : now();

            $existingMaterial = SupplierMaterial::where('supplier_id', $supplier->id)
                ->where('material_name', $name)->first();

            if ($existingMaterial) {
                // Update existing
                if (floatval($existingMaterial->current_price) !== $price) {
                    SupplierPriceHistory::create([
                        'supplier_material_id' => $existingMaterial->id,
                        'old_price' => $existingMaterial->current_price,
                        'new_price' => $price,
                        'note' => 'Cập nhật từ file Excel/CSV',
                        'changed_at' => $changedAt
                    ]);
                    $existingMaterial->current_price = $price;
                }
                
                if (isset($matData['unit']) && !empty(trim($matData['unit']))) {
                    $existingMaterial->unit = trim($matData['unit']);
                }
                
                $existingMaterial->save();
                $updatedCount++;
            } else {
                // Create new
                $newMat = SupplierMaterial::create([
                    'supplier_id' => $supplier->id,
                    'material_name' => $name,
                    'unit' => $unit,
                    'current_price' => $price
                ]);
                
                SupplierPriceHistory::create([
                    'supplier_material_id' => $newMat->id,
                    'old_price' => 0,
                    'new_price' => $price,
                    'note' => 'Khởi tạo từ file Excel/CSV',
                    'changed_at' => $changedAt
                ]);
                
                $addedCount++;
            }
        }

        return response()->json([
            'message' => "Đã xử lý file! Thêm mới: $addedCount, Cập nhật: $updatedCount",
            'data' => $supplier->load(['materials.priceHistories' => function($q){
                $q->orderBy('changed_at', 'desc');
            }])
        ]);
    }

    // Cập nhật giá vật tư (lưu lịch sử)
    public function updatePrice(Request $request, $materialId)
    {
        $request->validate([
            'new_price' => 'required|numeric|min:0',
            'note' => 'nullable|string',
            'unit' => 'nullable|string|max:50'
        ]);

        $material = SupplierMaterial::findOrFail($materialId);
        $oldPrice = $material->current_price;
        $newPrice = $request->new_price;

        if ($oldPrice != $newPrice) {
            // Create history record
            SupplierPriceHistory::create([
                'supplier_material_id' => $material->id,
                'old_price' => $oldPrice,
                'new_price' => $newPrice,
                'note' => $request->note,
            ]);
            
            // Update current price
            $material->current_price = $newPrice;
        }

        // Allow updating unit as well
        if (isset($request->unit)) {
            $material->unit = $request->unit;
        }

        $material->save();

        return response()->json(['message' => 'Cập nhật giá thành công', 'data' => $material->load('priceHistories')]);
    }

    // Lấy lịch sử giá
    public function getPriceHistory($materialId)
    {
        $history = SupplierPriceHistory::where('supplier_material_id', $materialId)
            ->orderBy('changed_at', 'desc')
            ->get();
        return response()->json($history);
    }

    // Xóa vật tư
    public function deleteMaterial($id)
    {
        SupplierMaterial::destroy($id);
        return response()->json(['message' => 'Đã xóa vật tư']);
    }
}