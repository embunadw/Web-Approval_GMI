<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
    ];

    // Relasi request yang dibuat user
    public function requests()
    {
        return $this->hasMany(Request::class, 'user_id');
    }

    // Relasi request yang di-approve sebagai Leader
    public function leaderApprovedRequests()
    {
        return $this->hasMany(Request::class, 'leader_approved_by');
    }

    // Relasi request yang di-approve sebagai spv
    public function spvApprovedRequests()
    {
        return $this->hasMany(Request::class, 'spv_approved_by');
    }

    // Relasi request yang di-approve sebagai Manager
    public function managerApprovedRequests()
    {
        return $this->hasMany(Request::class, 'manager_approved_by');
    }

    // Helper methods untuk checking role
    public function isUser()
    {
        return $this->role === 'user';
    }

    public function isLeader()
    {
        return $this->role === 'leader';
    }

    public function isspv()
    {
        return $this->role === 'spv';
    }

    public function isManager()
    {
        return $this->role === 'manager';
    }

    // Method untuk cek apakah user bisa approve di level tertentu
    public function canApproveAtLevel($level)
    {
        $levels = [
            'leader' => $this->isLeader(),
            'spv' => $this->isspv(),
            'manager' => $this->isManager(),
        ];

        return $levels[$level] ?? false;
    }
}