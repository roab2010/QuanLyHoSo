<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class CategoryTaskTemplate extends Model
{
    use Auditable;

    protected $table = 'category_task_templates';
    public $timestamps = false;

    protected $fillable = ['category_id', 'task_name', 'work_volume', 'sort_order', 'estimated_completion_date'];

    // Khai báo quan hệ ngược lại: Tính năng này thuộc về Danh mục nào
    public function category()
    {
        return $this->belongsTo(ProjectCategory::class, 'category_id', 'id');
    }
}
