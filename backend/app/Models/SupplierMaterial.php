<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierMaterial extends Model
{
    use HasFactory;

    protected $table = 'supplier_materials';

    protected $fillable = [
        'supplier_id',
        'material_name',
        'unit',
        'current_price'
    ];

    protected $casts = [
        'current_price' => 'decimal:2',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function priceHistories()
    {
        return $this->hasMany(SupplierPriceHistory::class, 'supplier_material_id');
    }
}
