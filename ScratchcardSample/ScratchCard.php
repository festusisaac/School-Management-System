<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

use App\Traits\Auditable;

class ScratchCard extends Model
{
    use HasFactory, Auditable;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'scratch_cards';

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'code',
        'pin',
        'status',
        'expiry_date',
        'sold_by',
        'redeemed_by',
        'redeemed_at',
        'value',
        'term_id',
        'session_id',
        'student_id',
        'batch_id',
        'usage_count',
        'max_usage',
        'metadata'
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function term()
    {
        return $this->belongsTo(Term::class);
    }

    public function session()
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function batch()
    {
        return $this->belongsTo(ScratchCardBatch::class);
    }
}
