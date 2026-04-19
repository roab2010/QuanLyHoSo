<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConstructionLog extends Model
{
    protected $table = 'construction_logs';

    protected $fillable = [
        'project_id',
        'log_date',
        'title',
        'description',
        'weather',
        'created_by',
    ];

    protected $casts = [
        'log_date' => 'date',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function images()
    {
        return $this->hasMany(ConstructionLogImage::class)->orderBy('taken_at', 'desc');
    }
}
