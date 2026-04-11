<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    // 1. Chỉ định tên bảng (nếu bảng của ông là 'suppliers' thì không cần, 
    // nhưng cứ viết vào cho chắc chắn)
    protected $table = 'suppliers';

    // 2. Tắt timestamps nếu trong bảng của ông KHÔNG có 2 cột created_at và updated_at
    public $timestamps = false; 

    // 3. Khai báo các cột được phép thêm/sửa (Fillable)
    // Phải khớp 100% với các cột ông đã liệt kê
    protected $fillable = [
        'supplier_code',
        'tax_code',
        'main_material_type',
        'name',
        'logo_url',
        'phone',
        'email',
        'address',
        'status',
        'rating_stars',
        'evaluation_tag',
        'is_strategic'
    ];

    // 4. Ép kiểu dữ liệu (Casting)
    // Giúp Laravel hiểu đúng định dạng khi trả về React
    protected $casts = [
        'is_strategic' => 'boolean',
        'rating_stars' => 'integer',
    ];
}