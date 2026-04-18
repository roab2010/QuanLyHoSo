<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class CategoryDocumentTemplate extends Model
{
    use Auditable;

    protected $table = 'category_document_templates';

    protected $fillable = [
        'category_id',
        'document_name',
        'category_name',
        'is_required',
        'sort_order',
    ];

    public function category()
    {
        return $this->belongsTo(ProjectCategory::class, 'category_id');
    }
}
