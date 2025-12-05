<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Request extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'item_id',
        'quantity',
        'status',
        
        // Leader approval
        'leader_status',
        'leader_approved_by',
        'leader_approved_at',
        'leader_rejection_reason',
        
        // SPV approval
        'SPV_status',
        'SPV_approved_by',
        'SPV_approved_at',
        'SPV_rejection_reason',
        
        // Manager approval
        'manager_status',
        'manager_approved_by',
        'manager_approved_at',
        'manager_rejection_reason',
    ];

    protected $casts = [
        'leader_approved_at' => 'datetime',
        'SPV_approved_at' => 'datetime',
        'manager_approved_at' => 'datetime',
    ];

    // Relasi ke User yang membuat request
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Relasi ke Master Item
    public function item()
    {
        return $this->belongsTo(MasterItem::class, 'item_id');
    }

    // Relasi ke Leader approver
    public function leaderApprover()
    {
        return $this->belongsTo(User::class, 'leader_approved_by');
    }

    // Relasi ke SPV approver
    public function SPVApprover()
    {
        return $this->belongsTo(User::class, 'SPV_approved_by');
    }

    // Relasi ke Manager approver
    public function managerApprover()
    {
        return $this->belongsTo(User::class, 'manager_approved_by');
    }

    // Status checking methods
    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isFullyApproved()
    {
        return $this->status === 'approved' && 
               $this->leader_status === 'approved' && 
               $this->SPV_status === 'approved' && 
               $this->manager_status === 'approved';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }

    // Check status per level
    public function isLeaderApproved()
    {
        return $this->leader_status === 'approved';
    }

    public function isSPVApproved()
    {
        return $this->SPV_status === 'approved';
    }

    public function isManagerApproved()
    {
        return $this->manager_status === 'approved';
    }

    // Check apakah request sedang menunggu approval di level tertentu
    public function isPendingLeaderApproval()
    {
        return $this->status === 'pending' && 
               ($this->leader_status === 'pending' || $this->leader_status === null);
    }

    public function isPendingSPVApproval()
    {
        return $this->status === 'pending' && 
               $this->leader_status === 'approved' && 
               ($this->SPV_status === 'pending' || $this->SPV_status === null);
    }

    public function isPendingManagerApproval()
    {
        return $this->status === 'pending' && 
               $this->leader_status === 'approved' && 
               $this->SPV_status === 'approved' && 
               ($this->manager_status === 'pending' || $this->manager_status === null);
    }

    // Get current approval level
    public function getCurrentApprovalLevel()
    {
        if (!$this->isLeaderApproved()) {
            return 'leader';
        }
        if (!$this->isSPVApproved()) {
            return 'SPV';
        }
        if (!$this->isManagerApproved()) {
            return 'manager';
        }
        return 'completed';
    }

    // Get rejection reason based on which level rejected
    public function getRejectionReason()
    {
        if ($this->leader_status === 'rejected') {
            return $this->leader_rejection_reason;
        }
        if ($this->SPV_status === 'rejected') {
            return $this->SPV_rejection_reason;
        }
        if ($this->manager_status === 'rejected') {
            return $this->manager_rejection_reason;
        }
        return null;
    }

    // Get who rejected
    public function getRejectedBy()
    {
        if ($this->leader_status === 'rejected') {
            return 'Leader';
        }
        if ($this->SPV_status === 'rejected') {
            return 'SPV';
        }
        if ($this->manager_status === 'rejected') {
            return 'Manager';
        }
        return null;
    }
}