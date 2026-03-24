<?php

namespace App\Http\Controllers;

use App\Models\ScratchCard;
use App\Models\ScratchCardBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
class ScratchCardController extends Controller
{
    public function generate(Request $request)
    {
        // Coerce checkbox fields to boolean so Laravel's boolean rule accepts them
        

        $request->validate([
            'quantity' => 'required|integer|min:1|max:1000',
            'value' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date|after:today',
            'max_usage' => 'nullable|integer|min:1',
            'session_id' => 'required|exists:academic_sessions,id',
            'batch_name' => 'nullable|string|max:191',
            'code_prefix' => 'nullable|string|max:20',
            'code_suffix' => 'nullable|string|max:20',
            'code_length' => 'nullable|integer|min:4|max:64',
            'code_charset' => 'nullable|in:alnum,numeric,hex',
            'pin_length' => 'nullable|integer|min:4|max:32',
            'pin_charset' => 'nullable|in:alnum,numeric,hex',
            'class_id' => 'nullable|exists:classes,id',
            'grade' => 'nullable|string|max:50',
            'page_size' => 'nullable|in:A4,Letter',
            'orientation' => 'nullable|in:portrait,landscape',
            'cards_per_sheet' => 'nullable|integer|min:1|max:50',
            'template' => 'nullable|string|max:100'
        ]);
        try {
            $session = \App\Models\AcademicSession::find($request->session_id);
            $batchName = $request->batch_name ? $request->batch_name : "{$session->name} - " . now()->format('Y-m-d H:i:s');

            $batch = \App\Models\ScratchCardBatch::create([
                'name' => $batchName,
                'session_id' => $request->session_id,
                'quantity' => $request->quantity,
                'status' => 'active',
                'created_by' => $request->user()?->id ?? auth()->id()
            ]);

            // Defaults for generation options
            $codeLength = $request->code_length ?? 16;
            $codeCharset = $request->code_charset ?? 'alnum';
            $pinLength = $request->pin_length ?? 8;
            $pinCharset = $request->pin_charset ?? 'alnum';

            // No CSV student pre-assignment (feature removed)

            $cards = [];
            for ($i = 0; $i < $request->quantity; $i++) {
                $generatedCode = $this->generateRandomString($codeLength, $codeCharset);
                $code = strtoupper(($request->code_prefix ?? '') . $generatedCode . ($request->code_suffix ?? ''));
                $pin = strtoupper($this->generateRandomString($pinLength, $pinCharset));

                $cardData = [
                    'id' => (string) Str::uuid(),
                    'batch_id' => $batch->id,
                    'code' => $code,
                    'pin' => $pin,
                    'status' => 'unsold',
                    'value' => $request->value,
                    'expiry_date' => $request->expiry_date,
                    'max_usage' => $request->max_usage ?? 5,
                    'session_id' => $request->session_id,
                    'usage_count' => 0,
                    'created_at' => now(),
                    'updated_at' => now()
                ];

                // No student pre-assignment

                // Store metadata (class/grade/template/print options)
                $metadata = [];
                if ($request->class_id) $metadata['class_id'] = $request->class_id;
                if ($request->grade) $metadata['grade'] = $request->grade;
                if ($request->template) $metadata['template'] = $request->template;
                if ($request->print_after) {
                    $metadata['print_options'] = [
                        'page_size' => $request->page_size ?? 'A4',
                        'orientation' => $request->orientation ?? 'portrait',
                        'cards_per_sheet' => $request->cards_per_sheet ?? 8
                    ];
                }

                if (!empty($metadata) && Schema::hasColumn('scratch_cards', 'metadata')) {
                    $cardData['metadata'] = json_encode($metadata);
                }

                $cards[] = $cardData;
            }

            ScratchCard::insert($cards);

            // Log the bulk generation action manually since insert() doesn't fire events
            \App\Models\AuditLog::log("Generated {$request->quantity} Scratch Cards", [
                'batch_id' => $batch->id,
                'batch_name' => $batch->name,
                'quantity' => $request->quantity,
                'value' => $request->value
            ]);

 return response()->json([
    'message' => "{$request->quantity} scratch cards generated successfully in batch: {$batch->name}",
    'cards' => $cards,
    'batch' => $batch
]);
            if ($request->print_after) {
                $response['print_url'] = route('scratch-cards.print', $batch);
            }

            return response()->json($response);
        } catch (\Exception $e) {
            \Log::error('Scratch card generation failed: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Failed to generate cards: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate a random string according to charset type
     */
    private function generateRandomString(int $length, string $charset = 'alnum')
    {
        if ($charset === 'numeric') {
            $result = '';
            for ($i = 0; $i < $length; $i++) {
                $result .= random_int(0, 9);
            }
            return $result;
        }

        if ($charset === 'hex') {
            // hex chars -> need half bytes
            $bytes = random_bytes((int) ceil($length / 2));
            $hex = substr(bin2hex($bytes), 0, $length);
            return $hex;
        }

        // default alnum
        return strtoupper(Str::random($length));
    }

    /**
     * Validate a scratch card for a specific student, term and session.
     * Returns the card if valid, or throws an exception/returns error response.
     */
    public function validateCard($pin, $serial, $studentId, $termId, $sessionId)
    {
        $card = ScratchCard::where('pin', strtoupper($pin))
                          ->where('code', strtoupper($serial))
                          ->first();
        
        $logData = [
            'action' => 'validate',
            'details' => [
                'pin' => $pin,
                'serial' => $serial,
                'student_id' => $studentId,
                'term_id' => $termId,
                'session_id' => $sessionId
            ],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent()
        ];

        if (!$card) {
            \App\Models\ScratchCardLog::create(array_merge($logData, [
                'status' => false,
                'failure_reason' => 'Invalid scratch card details'
            ]));
            return ['valid' => false, 'message' => 'Invalid scratch card details'];
        }
        
        $logData['scratch_card_id'] = $card->id;

        // Ensure the card's batch is active (if it belongs to one)
        $batch = $card->batch;
        if ($batch && $batch->status !== 'active') {
            \App\Models\ScratchCardLog::create(array_merge($logData, [
                'status' => false,
                'failure_reason' => 'Card belongs to an inactive batch'
            ]));

            return ['valid' => false, 'message' => 'This card belongs to an inactive batch'];
        }

        // Ensure the results for the requested term are published (term-level control)
        if ($termId) {
            try {
                $term = \App\Models\Term::find($termId);
                if ($term && strtolower($term->result_status) !== 'published') {
                    \App\Models\ScratchCardLog::create(array_merge($logData, [
                        'status' => false,
                        'failure_reason' => 'Results for this term not published',
                        'term_id' => $termId
                    ]));

                    return ['valid' => false, 'message' => 'Results for this batch have not yet been released. Please check back later.'];
                }
            } catch (\Throwable $e) {
                // ignore lookup errors and allow other checks to proceed
            }
        }

        // Check if card belongs to the current session
        if ($card->session_id && $card->session_id !== $sessionId) {
            \App\Models\ScratchCardLog::create(array_merge($logData, [
                'status' => false,
                'failure_reason' => 'Card belongs to a different session'
            ]));
            return ['valid' => false, 'message' => 'This card is not valid for the current session'];
        }

        if ($card->expiry_date && Carbon::parse($card->expiry_date)->isPast()) {
            \App\Models\ScratchCardLog::create(array_merge($logData, [
                'status' => false,
                'failure_reason' => 'Card expired'
            ]));
            return ['valid' => false, 'message' => 'Card expired'];
        }

        // Check if card has exceeded maximum usage limit
        if ($card->usage_count >= $card->max_usage) {
            \App\Models\ScratchCardLog::create(array_merge($logData, [
                'status' => false,
                'failure_reason' => 'Card usage limit exceeded'
            ]));
            return ['valid' => false, 'message' => 'This card has exceeded its usage limit'];
        }

        // Check if card is already used
        if ($card->usage_count > 0) {
            if ($card->student_id !== $studentId || 
                $card->term_id != $termId || 
                $card->session_id !== $sessionId) {
                
                \App\Models\ScratchCardLog::create(array_merge($logData, [
                    'status' => false,
                    'failure_reason' => 'Card already used by another student or for another term'
                ]));
                return ['valid' => false, 'message' => 'Card already used by another student or for another term'];
            }
        }

        \App\Models\ScratchCardLog::create(array_merge($logData, [
            'status' => true
        ]));

        return ['valid' => true, 'card' => $card];
    }

    public function index(Request $request)
    {
        if ($request->wantsJson()) {
            $query = ScratchCard::with(['batch', 'student']);

            // Basic status filter
            if ($request->status) {
                $query->where('status', $request->status);
            }

            // Serial number range (code)
            if ($request->filled('serial_from') || $request->filled('serial_to')) {
                $from = $request->serial_from;
                $to = $request->serial_to;
                if ($from && $to) {
                    $query->whereBetween('code', [$from, $to]);
                } elseif ($from) {
                    $query->where('code', '>=', $from);
                } elseif ($to) {
                    $query->where('code', '<=', $to);
                }
            }

            // Exact PIN match
            if ($request->filled('pin')) {
                $query->where('pin', strtoupper($request->pin));
            }

            // Batch filter
            // Batch filter by id or name
            if ($request->filled('batch_id')) {
                $query->where('batch_id', $request->batch_id);
            }

            if ($request->filled('batch_name')) {
                $name = $request->batch_name;
                $batchIds = \App\Models\ScratchCardBatch::where('name', 'like', "%{$name}%")->pluck('id');
                if ($batchIds->count()) {
                    $query->whereIn('batch_id', $batchIds->toArray());
                } else {
                    // no matching batch -> no results
                    $query->whereRaw('0 = 1');
                }
            }

            // Used in a specific term (term_id stored on card when used)
            if ($request->filled('used_in_term')) {
                $query->where('term_id', $request->used_in_term);
            }

            // Used by a specific student: accept numeric id or name
            if ($request->filled('used_by_student')) {
                $val = $request->used_by_student;

                // If the value is an actual student id (UUID) or numeric id, match directly
                $isStudentId = false;
                try {
                    if (is_numeric($val)) {
                        $isStudentId = true;
                    } else {
                        $isStudentId = \App\Models\Student::where('id', $val)->exists();
                    }
                } catch (\Throwable $e) {
                    $isStudentId = false;
                }

                if ($isStudentId) {
                    $query->where(function($q) use ($val) {
                        $q->where('student_id', $val)
                          ->orWhere('redeemed_by', $val);
                    });
                } else {
                    // try to match student by name or admission number (partial)
                    $studentIds = \App\Models\Student::where('full_name', 'like', "%{$val}%")
                        ->orWhere('adm_no', 'like', "%{$val}%")
                        ->pluck('id');
                    if ($studentIds->count()) {
                        $query->where(function($q) use ($studentIds) {
                            $q->whereIn('student_id', $studentIds)
                              ->orWhereIn('redeemed_by', $studentIds->toArray());
                        });
                    } else {
                        // no matching student; return empty
                        $query->whereRaw('0 = 1');
                    }
                }
            }

            // Debug: if used_by_student was provided, log the param and resulting match count
            try {
                if ($request->filled('used_by_student')) {
                    $count = (clone $query)->count();
                    \Log::info('ScratchCard search', ['used_by_student' => $request->used_by_student, 'result_count' => $count]);
                }
            } catch (\Throwable $e) {
                // swallow logging errors
            }

            return response()->json($query->orderBy('created_at', 'desc')->paginate(50));
        }
        
        // Analytics Data
        $totalGenerated = ScratchCard::count();
        $totalDistributed = ScratchCard::where('status', '!=', 'unsold')->count();
        $totalChecked = ScratchCard::sum('usage_count');
        $totalRedeemed = ScratchCard::where('status', 'redeemed')->count();
        
        // Overall Win Rate (Redemption Rate)
        $overallWinRate = $totalDistributed > 0 ? ($totalRedeemed / $totalDistributed) * 100 : 0;
        
        // Validation Attempts Trend (Past 7 Days)
        $trendData = \App\Models\ScratchCardLog::selectRaw('DATE(created_at) as date, count(*) as count')
            ->where('action', 'validate')
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();
            
        // Successful vs Failed Validations
        $successCount = \App\Models\ScratchCardLog::where('action', 'validate')->where('status', true)->count();
        $failCount = \App\Models\ScratchCardLog::where('action', 'validate')->where('status', false)->count();
        
        // Suspicious Activity Detection
        $suspiciousActivities = [];
        
        // 1. Excessive failed attempts from single IP (>5 in last hour)
        $suspiciousIPs = \App\Models\ScratchCardLog::selectRaw('ip_address, count(*) as attempts')
            ->where('action', 'validate')
            ->where('status', false)
            ->where('created_at', '>=', Carbon::now()->subHour())
            ->groupBy('ip_address')
            ->having('attempts', '>', 5)
            ->get();
            
        foreach ($suspiciousIPs as $ip) {
            $suspiciousActivities[] = [
                'type' => 'excessive_failures',
                'severity' => 'high',
                'message' => "IP {$ip->ip_address} had {$ip->attempts} failed validation attempts in the last hour",
                'time' => Carbon::now()
            ];
        }
        
        // 2. Attempts on expired cards (last 24 hours)
        $expiredAttempts = \App\Models\ScratchCardLog::where('action', 'validate')
            ->where('failure_reason', 'Card expired')
            ->where('created_at', '>=', Carbon::now()->subDay())
            ->count();
            
        if ($expiredAttempts > 10) {
            $suspiciousActivities[] = [
                'type' => 'expired_cards',
                'severity' => 'medium',
                'message' => "{$expiredAttempts} attempts on expired cards in the last 24 hours",
                'time' => Carbon::now()
            ];
        }
        
        // 3. Attempts on non-existent cards (last 24 hours)
        $invalidAttempts = \App\Models\ScratchCardLog::where('action', 'validate')
            ->where('failure_reason', 'Invalid scratch card details')
            ->where('created_at', '>=', Carbon::now()->subDay())
            ->count();
            
        if ($invalidAttempts > 20) {
            $suspiciousActivities[] = [
                'type' => 'invalid_cards',
                'severity' => 'high',
                'message' => "{$invalidAttempts} attempts with invalid card details in the last 24 hours",
                'time' => Carbon::now()
            ];
        }
        
        // Recent Audit Log (Last 20 entries)
        $recentLogs = \App\Models\ScratchCardLog::with('scratchCard')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function($log) {
                return [
                    'action' => $log->action,
                    'status' => $log->status ? 'Success' : 'Failed',
                    'reason' => $log->failure_reason,
                    'ip' => $log->ip_address,
                    'time' => $log->created_at->diffForHumans(),
                    'details' => $log->details
                ];
            });
        
        $sessions = \App\Models\AcademicSession::orderBy('created_at', 'desc')->get();
        $classes = \App\Models\ClassRoom::orderBy('name')->get();
        $batches = ScratchCardBatch::orderBy('created_at', 'desc')->get();

        // prepare list of students for filter (limit to recent 200)
        $students = \App\Models\Student::orderBy('name')->limit(200)->get();

        // distinct term ids present on cards (if any)
        $termIds = ScratchCard::whereNotNull('term_id')->distinct()->pluck('term_id')->filter()->values();
        $terms = collect();
        if ($termIds->count()) {
            // try to resolve term names if Term model exists
            try {
                $termModel = app()->make('\App\\Models\\Term');
                $terms = \App\Models\Term::whereIn('id', $termIds)->get();
            } catch (\Throwable $e) {
                // fallback to list of ids only
                $terms = $termIds->map(fn($id) => (object)['id' => $id, 'name' => "Term {$id}"]);
            }
        }

        return view('scratch_cards.index', compact(
            'totalGenerated', 
            'totalDistributed', 
            'totalChecked', 
            'totalRedeemed', 
            'overallWinRate',
            'trendData',
            'successCount',
            'failCount',
            'suspiciousActivities',
            'recentLogs',
            'sessions',
            'classes'
        ))->with(compact('batches', 'students', 'terms'));
    }

    public function redeem(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'pin' => 'required|string',
            'student_id' => 'required|exists:students,id'
        ]);

        $card = ScratchCard::where('code', strtoupper($request->code))
                          ->where('pin', strtoupper($request->pin))
                          ->first();

        if (!$card) {
            return response()->json([
                'message' => 'Invalid scratch card code or PIN'
            ], 422);
        }

        // Prevent redeeming cards from inactive batches
        $batch = $card->batch;
        if ($batch && $batch->status !== 'active') {
            return response()->json([
                'message' => 'This scratch card belongs to an inactive batch'
            ], 422);
        }

        if ($card->status === 'redeemed') {
            return response()->json([
                'message' => 'This scratch card has already been used'
            ], 422);
        }

        if ($card->status === 'unsold') {
            return response()->json([
                'message' => 'This scratch card has not been activated'
            ], 422);
        }

        if ($card->expiry_date && Carbon::parse($card->expiry_date)->isPast()) {
            return response()->json([
                'message' => 'This scratch card has expired'
            ], 422);
        }

        $card->update([
            'status' => 'redeemed',
            'redeemed_by' => $request->student_id,
            'redeemed_at' => now()
        ]);

        return response()->json([
            'message' => 'Scratch card redeemed successfully',
            'card' => $card
        ]);
    }

    public function sell(Request $request, ScratchCard $card)
    {
        // Disallow selling if the batch is inactive
        $batch = $card->batch;
        if ($batch && $batch->status !== 'active') {
            return response()->json([
                'message' => 'This card belongs to an inactive batch and cannot be sold'
            ], 422);
        }

        if ($card->status !== 'unsold') {
            return response()->json([
                'message' => 'This card cannot be sold'
            ], 422);
        }

        $card->update([
            'status' => 'sold',
            'sold_by' => $request->user()->id
        ]);

        return response()->json([
            'message' => 'Card marked as sold successfully',
            'card' => $card
        ]);
    }

    /**
     * Render a printable preview of a batch and auto-trigger the browser print dialog.
     */
    public function printBatch(ScratchCardBatch $batch)
    {
        $batch->load('cards');
        $cards = $batch->cards()->orderBy('created_at', 'asc')->get();

        return view('scratch_cards.batches.print', compact('batch', 'cards'));
    }
}