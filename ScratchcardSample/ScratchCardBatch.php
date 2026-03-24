<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

use App\Traits\Auditable;

class ScratchCardBatch extends Model
{
    use HasFactory, Auditable;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'scratch_card_batches';

    protected $fillable = [
        'name',
        'session_id',
        'quantity',
        'status',
        'created_by',
        'result_status',
        'published_by',
        'published_at'
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function isPublished()
    {
        return strtolower($this->result_status) === 'published';
    }

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function session()
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function cards()
    {
        return $this->hasMany(ScratchCard::class, 'batch_id');
    }
}
