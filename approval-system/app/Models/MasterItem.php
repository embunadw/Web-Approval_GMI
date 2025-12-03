<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterItem extends Model
{
    protected $fillable = [
        'item_code',
        'item_name',
        'category',
        'description',
    ];

    public function requests()
    {
        return $this->hasMany(Request::class, 'item_id');
    }
}