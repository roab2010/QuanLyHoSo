<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    protected $fillable = [
        'name', 'code', 'location', 'max_capacity', 'current_usage', 'status'
    ];
}