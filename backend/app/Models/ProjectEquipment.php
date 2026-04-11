<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectEquipment extends Model
{
    protected $table = 'project_equipments';
    public $timestamps = false;

    protected $fillable = [
        'project_id', 'product_id', 'quantity_dispatched',
        'quantity_returned', 'dispatched_date', 'status'
    ];

    protected $casts = [
        'dispatched_date' => 'date:Y-m-d',
        'quantity_dispatched' => 'decimal:2',
        'quantity_returned' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
