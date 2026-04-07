<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectCategory extends Model
{
    protected $table = 'project_categories'; // Trỏ đúng tên bảng
    public $timestamps = false; // Bảng này không dùng created_at

    protected $fillable = ['category_code', 'name', 'description', 'status'];

    // Khai báo quan hệ: 1 Danh mục có nhiều Tính năng/Công việc
    public function tasks()
    {
        return $this->hasMany(CategoryTaskTemplate::class, 'category_id', 'id')->orderBy('sort_order', 'asc');
    }
}
