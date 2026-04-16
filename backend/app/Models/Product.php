<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;
    // Tắt timestamps vì dữ liệu mẫu của ông không thấy có cột thời gian ở cuối
    public $timestamps = false; 

    protected $fillable = [
        'sku', 
        'name', 
        'unit', 
        'type', 
        'category_name', 
        'price', 
        'status', 
        'min_stock_level', 
        'current_stock',
        'warehouse_id',
        'supplier_id',
        'space_coefficient'
    ];

    // Ép kiểu dữ liệu để Laravel gửi xuống Database cho đúng định dạng số
    protected $casts = [
        'price' => 'decimal:2',
        'min_stock_level' => 'decimal:2',
        'current_stock' => 'decimal:2',
        'status' => 'integer',
        'warehouse_id' => 'integer',
        'supplier_id' => 'integer',
        'space_coefficient' => 'decimal:2',
    ];

    protected $appends = ['stock_status'];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function batches()
    {
        return $this->hasMany(ProductBatch::class);
    }

    public function getStockStatusAttribute()
    {
        $current = (float) ($this->current_stock ?? 0);
        $min = (float) ($this->min_stock_level ?? 0);

        if ($current <= 0) return 'Hết hàng';
        if ($current <= $min) return 'Sắp hết';
        return 'Còn hàng';
    }
}