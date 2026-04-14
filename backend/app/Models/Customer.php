<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    // Khai báo các cột được phép thêm/sửa nhanh
   protected $fillable = [
    'customer_code',
    'full_name',
    'email',
    'password',
    'phone',
    'address',
];

    // Vì trong SQL của Nguyên chỉ có created_at, không có updated_at
    public $timestamps = false;

    /**
     * Quan hệ: Một khách hàng có thể có nhiều dự án/hồ sơ
     */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'customer_id', 'id');
    }
}
