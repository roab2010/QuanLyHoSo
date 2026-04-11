<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransactionDetail extends Model
{
    public $timestamps = false;
    protected $fillable = [
       'transaction_id', 
        'product_id', 
        'quantity', 
        'unit_price',
        
    ];

    // Liên kết ngược lại với sản phẩm
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}