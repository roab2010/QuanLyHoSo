<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class InventoryTransactionDetail extends Model
{
    use Auditable;

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

    public function transaction()
    {
        return $this->belongsTo(InventoryTransaction::class, 'inventory_transaction_id');
    }
}