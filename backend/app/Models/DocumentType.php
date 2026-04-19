<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentType extends Model
{
    protected $table = 'document_types';
    public $timestamps = false;

    protected $fillable = ['group_name', 'type_name', 'icon_name', 'theme_color', 'description', 'assigned_workflow_id'];

    public function documents()
    {
        return $this->hasMany(ProjectDocument::class, 'document_type_id');
    }
}
