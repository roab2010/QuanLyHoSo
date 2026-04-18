<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemAuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'module',
        'action_type',
        'table_name',
        'record_id',
        'old_values',
        'new_values',
        'ip_address',
        'created_at'
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Helper to log an action
     */
    public static function log($module, $actionType, $tableName, $recordId = null, $oldValues = null, $newValues = null)
    {
        // Try to get user ID from header first (for local non-auth dev environments)
        // Fallback to 1 if no valid user_id is found, stopping Integrity Constraint Violation
        $userId = request()->header('X-User-ID') ?? auth()->id() ?? 1;

        
        return self::create([
            'user_id' => $userId,
            'module' => $module,
            'action_type' => $actionType,
            'table_name' => $tableName,
            'record_id' => $recordId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'created_at' => now(), // Đảm bảo dùng giờ của ứng dụng (Asia/Ho_Chi_Minh)
        ]);
    }
}
