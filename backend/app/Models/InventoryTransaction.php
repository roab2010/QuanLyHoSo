<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{   
    public $timestamps = false;
    // Khai báo các cột được phép ghi dữ liệu vào
    protected $fillable = [
        'transaction_code', 
        'type', 
        'supplier_id', 
        'project_id', 
        'created_by', 
        'transaction_date', 
        'note', 
        'status'
    ];

    // Tạo liên kết với bảng chi tiết (Nếu sau này ông muốn lấy dữ liệu ra)
    public function details()
    {
        return $this->hasMany(InventoryTransactionDetail::class);
    }
}