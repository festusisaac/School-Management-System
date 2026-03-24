<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScratchCardLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'scratch_card_id',
        'action',
        'status',
        'failure_reason',
        'details',
        'ip_address',
        'user_agent'
    ];

    protected $casts = [
        'status' => 'boolean',
        'details' => 'array'
    ];

    public function scratchCard()
    {
        return $this->belongsTo(ScratchCard::class);
    }
}
