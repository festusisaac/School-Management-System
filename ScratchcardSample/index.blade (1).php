@extends('layouts.app')

@section('title', 'Scratch Card Batches')

@section('content')
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-semibold text-gray-900">Scratch Card Batches</h1>
        <a href="{{ route('scratch-cards.index') }}" class="text-indigo-600 hover:text-indigo-900">
            &larr; Back to Dashboard
        </a>
    </div>

    <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <!-- Advanced Search (submits to scratch-cards index) -->
        <div class="p-4 border-b border-gray-200 bg-gray-50">
            <form action="{{ route('scratch-cards.index') }}" method="GET" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Batch Name</label>
                    <input name="batch_name" value="{{ request('batch_name') }}" placeholder="Type a batch name (partial match)" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                </div>

                

                <div class="md:col-span-2 relative">
                    <label class="block text-sm font-medium text-gray-700">Used by Student</label>
                    <input id="student-autocomplete" type="text" placeholder="Type student name or admission number" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <input id="used_by_student" type="hidden" name="used_by_student" value="{{ request('used_by_student') }}">
                    <div id="student-suggestions" class="absolute left-0 right-0 bg-white border border-gray-200 mt-1 rounded-md shadow z-40 hidden max-h-60 overflow-auto"></div>
                </div>

                <div class="flex items-end space-x-2 md:col-span-3">
                    <button type="submit" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">Search Cards</button>
                    <a href="{{ route('scratch-cards.batches.index') }}" class="bg-white border px-4 py-2 rounded-md">Clear</a>
                </div>
            </form>

            <!-- Inline results panel (AJAX) -->
            <div id="cards-results" class="mt-4"></div>
        </div>
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch Name
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cards (Used/Total)
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                    </th>
                    <th scope="col" class="relative px-6 py-3">
                        <span class="sr-only">Actions</span>
                    </th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                @forelse($batches as $batch)
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {{ $batch->name }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ $batch->session->name ?? 'N/A' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ $batch->used_cards }} / {{ $batch->total_cards }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {{ $batch->status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }}">
                            {{ ucfirst($batch->status) }}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ $batch->created_at->format('M d, Y H:i') }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="{{ route('scratch-cards.batches.show', $batch) }}" class="text-indigo-600 hover:text-indigo-900 mr-4">View</a>
                        
                        <form action="{{ route('scratch-cards.batches.destroy', $batch) }}" method="POST" class="inline-block js-confirm-delete" data-confirm="Are you sure you want to delete this batch? This action cannot be undone.">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="text-red-600 hover:text-red-900">Delete</button>
                        </form>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No batches found.
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
        <div class="px-4 py-3 border-t border-gray-200 sm:px-6">
            {{ $batches->links() }}
        </div>
    </div>
    </div>

    <!-- Confirmation modal (hidden by default) -->
    <div id="confirm-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black bg-opacity-40">
        <div class="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
            <h3 class="text-lg font-semibold mb-2">Please confirm</h3>
            <p id="confirm-message" class="text-sm text-gray-700 mb-4">Are you sure?</p>
            <div class="flex justify-end space-x-2">
                <button id="confirm-cancel" class="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button id="confirm-ok" class="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
            </div>
        </div>
    </div>

    <script>
        (function(){
            const modal = document.getElementById('confirm-modal');
            const msgEl = document.getElementById('confirm-message');
            const okBtn = document.getElementById('confirm-ok');
            const cancelBtn = document.getElementById('confirm-cancel');
            let activeForm = null;

            function showModal(message, form) {
                activeForm = form;
                msgEl.textContent = message;
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }

            function hideModal() {
                activeForm = null;
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }

            document.querySelectorAll('.js-confirm-delete').forEach(function(form){
                form.addEventListener('submit', function(e){
                    e.preventDefault();
                    const message = form.getAttribute('data-confirm') || 'Are you sure?';
                    showModal(message, form);
                });
            });

            cancelBtn.addEventListener('click', function(){ hideModal(); });

            okBtn.addEventListener('click', function(){
                if (activeForm) {
                    // optionally show a small spinner or disable button
                    activeForm.submit();
                }
            });

            // Close modal on ESC
            document.addEventListener('keydown', function(e){
                if (e.key === 'Escape' && !modal.classList.contains('hidden')) hideModal();
            });
        })();

        // Student autocomplete
        (function(){
            const input = document.getElementById('student-autocomplete');
            const hidden = document.getElementById('used_by_student');
            const suggestions = document.getElementById('student-suggestions');
            let timer = null;

            if (!input) return;

            input.addEventListener('input', function(){
                const q = input.value.trim();
                hidden.value = '';
                if (timer) clearTimeout(timer);
                if (q.length < 2) { suggestions.classList.add('hidden'); return; }
                timer = setTimeout(async function(){
                    try {
                        const res = await fetch(`{{ route('students.autocomplete') }}?q=${encodeURIComponent(q)}`, { headers: { 'Accept': 'application/json' } });
                        if (!res.ok) throw new Error('Network error');
                        const items = await res.json();
                        if (!items.length) { suggestions.innerHTML = '<div class="p-2 text-sm text-gray-500">No matches</div>'; suggestions.classList.remove('hidden'); return; }
                        suggestions.innerHTML = items.map(it => `
                            <div class="px-3 py-2 hover:bg-gray-100 cursor-pointer" data-id="${it.id}" data-label="${(it.full_name||'')}">${it.label}</div>
                        `).join('');
                        suggestions.classList.remove('hidden');

                        suggestions.querySelectorAll('div[data-id]').forEach(function(el){
                            el.addEventListener('click', function(){
                                hidden.value = this.getAttribute('data-id');
                                input.value = this.getAttribute('data-label') || this.textContent;
                                suggestions.classList.add('hidden');
                            });
                        });
                    } catch (e) { console.error(e); }
                }, 250);
            });

            // close suggestions when clicking outside
            document.addEventListener('click', function(e){
                if (!e.target.closest('#student-autocomplete') && !e.target.closest('#student-suggestions')) {
                    suggestions.classList.add('hidden');
                }
            });
        })();

        // AJAX search + results rendering
        (function(){
            const form = document.querySelector('#cards-results')?.closest('form') || document.querySelector('form[action="{{ route('scratch-cards.index') }}"]');
            const resultsEl = document.getElementById('cards-results');

            if (!form || !resultsEl) return;

            function buildParams(formData, page = 1) {
                const params = new URLSearchParams();
                for (const [k, v] of formData.entries()) {
                    if (v === null || v === undefined || v === '') continue;
                    params.append(k, v);
                }
                if (page && page > 1) params.set('page', page);
                return params.toString();
            }

            async function fetchCards(paramsString) {
                resultsEl.innerHTML = '<div class="p-4 text-sm text-gray-500">Loading...</div>';
                try {
                    const res = await fetch(`{{ route('scratch-cards.index') }}?${paramsString}`, { headers: { 'Accept': 'application/json' } });
                    if (!res.ok) throw new Error('Network error');
                    const body = await res.json();
                    renderResults(body);
                } catch (e) {
                    console.error(e);
                    resultsEl.innerHTML = `<div class="p-4 text-sm text-red-600">Error loading results: ${e.message}</div>`;
                }
            }

            function renderResults(payload) {
                const items = payload.data || [];
                if (!items.length) {
                    resultsEl.innerHTML = '<div class="p-4 text-sm text-gray-500">No cards matched your search.</div>';
                    return;
                }

                const table = document.createElement('div');
                table.innerHTML = `
                    <div class="overflow-x-auto bg-white rounded-md border border-gray-200">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PIN</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used By</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">${items.map(card => `
                                <tr>
                                    <td class="px-4 py-2 text-sm font-mono text-gray-900">${card.code}</td>
                                    <td class="px-4 py-2 text-sm font-mono font-bold">${card.pin}</td>
                                    <td class="px-4 py-2"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${card.status === 'unsold' ? 'bg-gray-100 text-gray-800' : (card.status === 'sold' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800')}">${card.status.toUpperCase()}</span></td>
                                    <td class="px-4 py-2 text-sm text-gray-500">${card.usage_count} / ${card.max_usage}</td>
                                    <td class="px-4 py-2 text-sm text-gray-500">${card.student && card.student.full_name ? card.student.full_name : (card.student_id ? 'Linked' : '-')}</td>
                                    <td class="px-4 py-2 text-sm text-gray-500">${new Date(card.created_at).toLocaleString()}</td>
                                </tr>`).join('')}</tbody>
                        </table>
                    </div>
                `;

                // Pagination
                const pager = document.createElement('div');
                pager.className = 'mt-3 flex items-center justify-between';
                const current = payload.current_page || (payload.meta && payload.meta.current_page) || 1;
                const last = payload.last_page || (payload.meta && payload.meta.last_page) || 1;

                let pagerHtml = `<div class="text-sm text-gray-600">Page ${current} of ${last} — ${payload.total ?? (payload.meta && payload.meta.total) ?? ''} results</div>`;
                pagerHtml += `<div class="space-x-2">`;
                if (current > 1) pagerHtml += `<button data-page="${current-1}" class="px-3 py-1 bg-white border rounded">Prev</button>`;
                if (current < last) pagerHtml += `<button data-page="${current+1}" class="px-3 py-1 bg-white border rounded">Next</button>`;
                pagerHtml += `</div>`;
                pager.innerHTML = pagerHtml;

                resultsEl.innerHTML = '';
                resultsEl.appendChild(table);
                resultsEl.appendChild(pager);

                // attach handlers
                pager.querySelectorAll('button[data-page]').forEach(btn => {
                    btn.addEventListener('click', function(){
                        const page = parseInt(this.getAttribute('data-page'), 10) || 1;
                        const fd = new FormData(form);
                        const params = buildParams(fd, page);
                        fetchCards(params);
                    });
                });
            }

            form.addEventListener('submit', async function(e){
                e.preventDefault();
                const fd = new FormData(form);
                const params = buildParams(fd, 1);
                // push URL so user can bookmark filters
                const url = `${location.pathname}?${params}`;
                history.pushState({}, '', url);
                await fetchCards(params);

                // Clear input fields after search is done
                try {
                    const batchName = form.querySelector('input[name="batch_name"]');
                    const studentInput = document.getElementById('student-autocomplete');
                    const hiddenStudent = document.getElementById('used_by_student');
                    if (batchName) batchName.value = '';
                    if (studentInput) studentInput.value = '';
                    if (hiddenStudent) hiddenStudent.value = '';
                    const sugg = document.getElementById('student-suggestions');
                    if (sugg) sugg.classList.add('hidden');
                } catch (e) { console.error('Failed to clear inputs', e); }
            });

            // If page loaded with query params, automatically perform a search
            (function autoSearchOnLoad(){
                const qs = location.search.replace(/^\?/, '');
                if (qs) fetchCards(qs);
            })();
        })();
    </script>
</div>
@endsection
