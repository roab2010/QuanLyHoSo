<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'products';
    public $timestamps = false;

    protected $fillable = [
        'sku', 'name', 'unit', 'type', 'category_name',
        'price', 'status', 'min_stock_level', 'current_stock'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'min_stock_level' => 'decimal:2',
        'current_stock' => 'decimal:2',
        'status' => 'boolean',
    ];
}
