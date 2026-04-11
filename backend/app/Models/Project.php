<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    // Tên bảng (đảm bảo đúng tên bảng trong database)
    protected $table = 'projects';
public $timestamps = false;
    // Các cột cho phép lưu/cập nhật hàng loạt
   protected $fillable = [
    'project_code', 
    'name', 
    'status', // BẮT BUỘC PHẢI CÓ
    'priority', 
    'address', 
    'start_date',
    'category_id',
    'customer_id'
];

    /**
     * Tự động ép kiểu dữ liệu khi lấy ra/lưu vào
     * Giúp React nhận đúng định dạng ngày tháng
     */
    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
    ];

    /* ───────────────────────── Quan hệ (Relationships) ───────────────────────── */

    // Kết nối với bảng Category (Dự án thuộc về 1 danh mục)
    public function category()
    {
        return $this->belongsTo(ProjectCategory::class, 'category_id');
    }

    // Kết nối với bảng Customer (Dự án thuộc về 1 khách hàng)
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    // Kết nối với bảng Employee (Người giám sát - Supervisor)
    public function supervisor()
    {
        return $this->belongsTo(Employee::class, 'supervisor_id');
    }

    // Thành viên dự án
    public function members()
    {
        return $this->hasMany(ProjectMember::class, 'project_id');
    }

    // Tài liệu pháp lý
    public function documents()
    {
        return $this->hasMany(ProjectDocument::class, 'project_id');
    }

    // Vật tư & Thiết bị
    public function equipments()
    {
        return $this->hasMany(ProjectEquipment::class, 'project_id');
    }

    // Công việc / Tiến độ
    public function tasks()
    {
        return $this->hasMany(ProjectTask::class, 'project_id');
    }
}