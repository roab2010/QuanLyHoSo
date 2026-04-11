<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model {
    public $timestamps = false; // Bắt buộc phải có dòng này
    protected $fillable = ['sku', 'name', 'unit', 'type', 'category_name', 'price', 'status', 'min_stock_level', 'current_stock'];
}