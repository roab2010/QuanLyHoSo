<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectPositionTitle extends Model
{
    protected $table = 'project_position_titles';

    protected $fillable = [
        'title_name',
    ];

    public function members()
    {
        return $this->hasMany(ProjectMember::class, 'project_position_id');
    }
}
