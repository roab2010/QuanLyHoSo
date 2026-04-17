<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierPriceHistory extends Model
{
    use HasFactory;

    protected $table = 'supplier_price_histories';

    public $timestamps = false; // We use changed_at

    protected $fillable = [
        'supplier_material_id',
        'old_price',
        'new_price',
        'note',
        'changed_at'
    ];

    protected $casts = [
        'old_price' => 'decimal:2',
        'new_price' => 'decimal:2',
        'changed_at' => 'datetime',
    ];

    public function material()
    {
        return $this->belongsTo(SupplierMaterial::class, 'supplier_material_id');
    }
}
