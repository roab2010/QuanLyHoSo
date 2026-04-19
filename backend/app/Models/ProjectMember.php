<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class ProjectMember extends Model
{
    use Auditable;
    protected $table = 'project_members';
    public $timestamps = false;

    protected $fillable = ['project_id', 'employee_id', 'project_position_id'];
    protected $appends = ['title_name'];

    public function getTitleNameAttribute()
    {
        return $this->position->title_name ?? ($this->projectPositionTitle->title_name ?? '');
    }

    public function projectPositionTitle()
    {
        return $this->belongsTo(ProjectPositionTitle::class, 'project_position_id');
    }

    public function position()
    {
        return $this->belongsTo(ProjectPositionTitle::class, 'project_position_id');
    }

    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
