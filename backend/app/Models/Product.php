<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    public $timestamps = false;
    protected $fillable = [
        'sku', 'name', 'unit', 'type', 'category_name', 
        'price', 'status', 'min_stock_level', 'current_stock'
    ];

    // CỰC KỲ QUAN TRỌNG: Thêm dòng này để status xuất hiện trong JSON API
    protected $appends = ['stock_status'];

    // Accessor: Tính toán trạng thái vật tư
    public function getStockStatusAttribute()
    {
        // Ép kiểu về số để so sánh chính xác tuyệt đối
        $current = (float) $this->current_stock;
        $min = (float) $this->min_stock_level;

        if ($current <= 0) return 'Hết hàng';
        if ($current <= $min) return 'Sắp hết';
        return 'Còn hàng';
    }
}