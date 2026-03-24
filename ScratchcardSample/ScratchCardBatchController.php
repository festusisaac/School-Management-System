<?php

namespace App\Http\Controllers;

use App\Models\ScratchCardBatch;
use Illuminate\Http\Request;

class ScratchCardBatchController extends Controller
{
    public function index()
    {
        $batches = ScratchCardBatch::with('session')
            ->withCount(['cards as total_cards', 'cards as used_cards' => function($query) {
                $query->where('usage_count', '>', 0);
            }])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // Collect distinct term ids used by cards in recent batches
        $termIds = \App\Models\ScratchCard::whereNotNull('term_id')->distinct()->pluck('term_id')->filter()->values();
        $terms = collect();
        if ($termIds->count()) {
            try {
                $terms = \App\Models\Term::whereIn('id', $termIds)->get();
            } catch (\Throwable $e) {
                $terms = $termIds->map(fn($id) => (object)['id' => $id, 'name' => "Term {$id}"]);
            }
        }

        return view('scratch_cards.batches.index', compact('batches', 'terms'));
    }

    public function show(ScratchCardBatch $batch)
    {
        // Load session relationship and fetch paginated cards separately so we have a paginator
        $batch->load('session');

        $cards = $batch->cards()->orderBy('created_at', 'desc')->paginate(50);

        return view('scratch_cards.batches.show', compact('batch', 'cards'));
    }

    public function destroy(Request $request, ScratchCardBatch $batch)
    {
        // Optional safety: check if any cards have been used
        $hasUsed = $batch->cards()->where('usage_count', '>', 0)->exists();

        // Allow forcing delete when `force=1` is provided and user is authorized
        $force = $request->boolean('force');

        if ($hasUsed && ! $force) {
            return back()->with('error', 'Cannot delete batch with used cards. To force deletion, send `force=1` (admins only).');
        }

        // If forcing, ensure user has permission (basic check: only allow admins)
        if ($force) {
            $user = $request->user();
            $isAdmin = false;
            if ($user) {
                if (method_exists($user, 'isAdmin')) {
                    $isAdmin = $user->isAdmin();
                } else {
                    // Fallback: check `role` or `is_admin` properties if present
                    $isAdmin = ($user->role ?? null) === 'admin' || ($user->is_admin ?? false) === true;
                }
            }

            if (! $isAdmin) {
                return back()->with('error', 'You are not authorized to force-delete batches.');
            }
        }

        // Delete cards (this will null batch_id if foreign keys are configured with nullOnDelete, but ensure cleanup)
        $batch->cards()->delete();
        $batch->delete();

        return redirect()->route('scratch-cards.batches.index')
            ->with('success', 'Batch deleted successfully.');
    }

    public function updateStatus(Request $request, ScratchCardBatch $batch)
    {
        $request->validate([
            'status' => 'required|in:active,inactive'
        ]);

        $batch->update(['status' => $request->status]);

        // Update all cards in the batch?
        // Maybe not necessary if we check batch status during validation

        return back()->with('success', 'Batch status updated.');
    }
}
