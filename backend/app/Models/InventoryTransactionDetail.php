<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransactionDetail extends Model
{
    public $timestamps = false;
    protected $fillable = [
        'inventory_transaction_id', 
        'product_id', 
        'quantity', 
        'unit_price'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}