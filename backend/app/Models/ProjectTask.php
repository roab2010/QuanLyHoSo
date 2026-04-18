<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\Auditable;

class ProjectTask extends Model
{
    use HasFactory, Auditable;
    protected $table = 'project_tasks';
    public $timestamps = false;

    protected $fillable = [
        'project_id', 'task_name', 'work_volume',
        'status', 'sort_order', 'completed_date'
    ];

    protected $casts = [
        'created_at' => 'datetime:Y-m-d H:i:s',
        'completed_date' => 'datetime:Y-m-d H:i:s',
        'work_volume' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }
}
