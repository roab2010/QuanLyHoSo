<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class ProjectDocument extends Model
{
    use Auditable;
    protected $table = 'project_documents';
    public $timestamps = false;

    protected $fillable = [
        'project_id', 'document_name', 'file_url',
        'uploaded_at', 'status', 'category_name', 'note'
    ];

    protected $casts = [
        'uploaded_at' => 'datetime:Y-m-d',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }
}
