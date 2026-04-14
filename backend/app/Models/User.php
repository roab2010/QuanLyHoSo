<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'username',
        'password_hash',
        'role_id',
        'status',
    ];

    protected $hidden = [
        'password_hash',
    ];

    // Ghi đè để Laravel hiểu cột mật khẩu là password_hash
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    public $timestamps = false;

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }
}
