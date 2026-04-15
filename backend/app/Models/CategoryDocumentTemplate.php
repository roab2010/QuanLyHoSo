<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoryDocumentTemplate extends Model
{
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
