<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = ['project_code', 'category_id', 'name', 'customer_id', 'supervisor_id', 'address', 'status', 'priority'];

    // Kết nối với bảng Category
    public function category()
    {
        return $this->belongsTo(ProjectCategory::class, 'category_id');
    }

    // Kết nối với bảng Customer
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }
}
