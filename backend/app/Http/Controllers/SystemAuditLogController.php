<?php

namespace App\Http\Controllers;

use App\Models\SystemAuditLog;
use Illuminate\Http\Request;

class SystemAuditLogController extends Controller
{
    public function index()
    {
        $logs = SystemAuditLog::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($logs);
    }
}
