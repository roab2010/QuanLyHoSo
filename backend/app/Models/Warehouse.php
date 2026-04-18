<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Warehouse extends Model
{
    use Auditable;
    protected $fillable = [
        'name', 'code', 'location', 'max_capacity', 'current_usage', 'status'
    ];
}