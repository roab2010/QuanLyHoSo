<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class InventoryTransaction extends Model
{
    use Auditable;

    // Để timestamps = true vì phiếu nhập cần biết chính xác ngày giờ tạo
    protected $fillable = [
        'transaction_code', 
        'type',             // 'IN' hoặc 'OUT'
        'supplier_id',      // Nhà cung cấp
        'project_id',       // Dự án (nếu xuất/nhập liên quan đến dự án)
        'warehouse_id',     // Kho lưu trữ
        'transaction_date', // Ngày nhập ông chọn từ React
        'created_by', 
        'status',
        'note',
    ];

    // Liên kết với chi tiết các món hàng trong phiếu
    public function details()
    {
        return $this->hasMany(InventoryTransactionDetail::class);
    }

    // Liên kết với Nhà cung cấp
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    // Liên kết với Kho
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}