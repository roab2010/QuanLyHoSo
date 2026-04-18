<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Employee extends Model
{
    use Auditable;
    protected $table = 'employees';
    public $timestamps = false;

    protected $fillable = [
        'department_id', 'job_title', 'user_id', 'employee_code',
        'full_name', 'email', 'avatar', 'phone', 'status'
    ];

    protected $casts = [
        'created_at' => 'datetime:Y-m-d H:i:s',
    ];
}
