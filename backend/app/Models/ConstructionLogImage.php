<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConstructionLogImage extends Model
{
    protected $table = 'construction_log_images';

    protected $fillable = [
        'construction_log_id',
        'image_url',
        'caption',
        'taken_at',
    ];

    protected $casts = [
        'taken_at' => 'datetime',
    ];

    public function log()
    {
        return $this->belongsTo(ConstructionLog::class, 'construction_log_id');
    }
}
