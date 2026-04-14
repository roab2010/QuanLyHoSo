<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HoSo extends Model
{
    protected $table = 'ho_so';

    protected $fillable = [
        'customer_id',
        'ten_du_an',
        'trang_thai',
        'tien_do'
    ];
}