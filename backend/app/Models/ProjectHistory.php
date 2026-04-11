<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectHistory extends Model
{
    use HasFactory;

    public $timestamps = false; // we only need created_at, which is handled manually or auto
    
    protected $fillable = [
        'project_id',
        'actor',
        'action',
        'created_at'
    ];
}
