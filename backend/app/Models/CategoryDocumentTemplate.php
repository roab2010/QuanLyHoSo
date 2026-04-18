<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class CategoryDocumentTemplate extends Model
{
    use Auditable;

    protected $table = 'category_document_templates';
    public $timestamps = false;

    protected $fillable = [
        'category_id',
        'document_type_id',
        'document_name',
        'sort_order',
        'is_required',
        'status',
    ];

    public function category()
    {
        return $this->belongsTo(ProjectCategory::class, 'category_id');
    }

    public function documentType()
    {
        return $this->belongsTo(DocumentType::class, 'document_type_id');
    }
}
