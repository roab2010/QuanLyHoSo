<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkflowProjectApprover extends Model
{
    protected $table = 'workflow_project_approvers';

    protected $fillable = [
        'workflow_step_id',
        'scope_type',
        'scope_id',
        'user_id',
        'role_id',
        'granted_by',
    ];

    public function workflowStep()
    {
        return $this->belongsTo(WorkflowStep::class, 'workflow_step_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function grantedBy()
    {
        return $this->belongsTo(User::class, 'granted_by');
    }
}
