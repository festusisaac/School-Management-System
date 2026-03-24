
@extends('layouts.app')

@section('title', 'Scratch Cards')
@section('page-title', 'Scratch Cards')
@section('page-description', 'Generate and manage result access cards')

@section('content')
<div class="container mx-auto px-4 py-6">
    <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Scratch Cards Management</h2>
            <div class="space-x-2">
                <a href="{{ route('scratch-cards.batches.index') }}" 
                   class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                    <i class="fas fa-layer-group"></i> View Batches
                </a>
                <button onclick="document.getElementById('generateModal').classList.remove('hidden')" 
                        class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    <i class="fas fa-plus"></i> Generate New Cards
                </button>
            </div>
        </div>

        <!-- Analytics Dashboard -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 class="text-sm font-medium text-blue-800">Total Cards Generated</h3>
                <p class="text-2xl font-bold text-blue-900">{{ number_format($totalGenerated) }}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 class="text-sm font-medium text-green-800">Cards Distributed</h3>
                <p class="text-2xl font-bold text-green-900">{{ number_format($totalDistributed) }}</p>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 class="text-sm font-medium text-purple-800">Total Validations</h3>
                <p class="text-2xl font-bold text-purple-900">{{ number_format($totalChecked) }}</p>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 class="text-sm font-medium text-yellow-800">Redeemed Cards</h3>
                <p class="text-2xl font-bold text-yellow-900">{{ number_format($totalRedeemed) }}</p>
                <p class="text-xs text-yellow-700 mt-1">Win Rate: {{ number_format($overallWinRate, 1) }}%</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Validation Attempts Trend (7 Days)</h3>
                <canvas id="trendChart" height="200"></canvas>
            </div>
            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Validation Success vs Failure</h3>
                <div class="h-64">
                    <canvas id="statusChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Security Alerts & Audit Log -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Suspicious Activity Alerts -->
            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                    <i class="fas fa-exclamation-triangle text-red-500"></i> Suspicious Activity Alerts
                </h3>
                @if(count($suspiciousActivities) > 0)
                    <div class="space-y-2">
                        @foreach($suspiciousActivities as $activity)
                            <div class="p-3 rounded-md {{ $activity['severity'] === 'high' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200' }}">
                                <div class="flex items-start">
                                    <div class="flex-shrink-0">
                                        @if($activity['severity'] === 'high')
                                            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                                            </svg>
                                        @else
                                            <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                                            </svg>
                                        @endif
                                    </div>
                                    <div class="ml-3 flex-1">
                                        <p class="text-sm {{ $activity['severity'] === 'high' ? 'text-red-800' : 'text-yellow-800' }}">
                                            {{ $activity['message'] }}
                                        </p>
                                        <p class="text-xs {{ $activity['severity'] === 'high' ? 'text-red-600' : 'text-yellow-600' }} mt-1">
                                            {{ $activity['time']->diffForHumans() }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @else
                    <div class="text-center py-8 text-gray-500">
                        <svg class="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p class="mt-2 text-sm font-medium">No suspicious activity detected</p>
                    </div>
                @endif
            </div>

            <!-- Recent Audit Log -->
            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                    <i class="fas fa-list-alt text-blue-500"></i> Recent Audit Log
                </h3>
                <div class="overflow-y-auto max-h-96">
                    @if(count($recentLogs) > 0)
                        <div class="space-y-2">
                            @foreach($recentLogs as $log)
                                <div class="p-2 rounded-md bg-gray-50 border border-gray-200 text-xs">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <span class="font-medium text-gray-900">{{ ucfirst($log['action']) }}</span>
                                            <span class="ml-2 px-2 py-0.5 rounded-full text-xs {{ $log['status'] === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }}">
                                                {{ $log['status'] }}
                                            </span>
                                            @if($log['reason'])
                                                <p class="text-gray-600 mt-1">{{ $log['reason'] }}</p>
                                            @endif
                                            <p class="text-gray-500 mt-1">IP: {{ $log['ip'] ?? 'N/A' }}</p>
                                        </div>
                                        <span class="text-gray-500 text-xs">{{ $log['time'] }}</span>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    @else
                        <div class="text-center py-8 text-gray-500">
                            <p class="text-sm">No recent activity</p>
                        </div>
                    @endif
                </div>
            </div>
        </div>

        

        <!-- Cards table removed from this dashboard view - use Batches page to search and view cards -->
    </div>
</div>

<!-- Generate Modal -->
<div id="generateModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden overflow-y-auto h-full w-full">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Generate Scratch Cards</h3>
            <form id="generateForm" class="mt-2 text-left">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700">Academic Session</label>
                    <select name="session_id" required
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                        <option value="">Select Session</option>
                        @foreach($sessions as $session)
                            <option value="{{ $session->id }}" {{ $session->active ? 'selected' : '' }}>
                                {{ $session->name }} {{ $session->active ? '(Active)' : '' }}
                            </option>
                        @endforeach
                    </select>
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium text-gray-700">Batch Name (optional)</label>
                    <input type="text" name="batch_name" placeholder="Optional batch name"
                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                </div>
                <div class="mb-3 grid grid-cols-2 gap-2">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Code Prefix</label>
                        <input type="text" name="code_prefix" class="mt-1 block w-full rounded-md border-gray-300" placeholder="PRE-">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Code Suffix</label>
                        <input type="text" name="code_suffix" class="mt-1 block w-full rounded-md border-gray-300" placeholder="-2025">
                    </div>
                </div>
                <div class="mb-3 grid grid-cols-3 gap-2">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Code Length</label>
                        <input type="number" name="code_length" min="4" max="64" value="16" class="mt-1 block w-full rounded-md border-gray-300">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Code Charset</label>
                        <select name="code_charset" class="mt-1 block w-full rounded-md border-gray-300">
                            <option value="alnum">Alphanumeric</option>
                            <option value="numeric">Numeric</option>
                            <option value="hex">Hex</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">PIN Length</label>
                        <input type="number" name="pin_length" min="4" max="32" value="8" class="mt-1 block w-full rounded-md border-gray-300">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium text-gray-700">PIN Charset</label>
                    <select name="pin_charset" class="mt-1 block w-full rounded-md border-gray-300">
                        <option value="alnum">Alphanumeric</option>
                        <option value="numeric">Numeric</option>
                        <option value="hex">Hex</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700">Quantity</label>
                    <input type="number" name="quantity" required min="1" max="1000" value="10"
                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700">Value (Price)</label>
                    <input type="number" name="value" required min="0" value="0"
                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700">Max Usage (per card)</label>
                    <input type="number" name="max_usage" required min="1" value="5"
                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium text-gray-700">Assign To Class (optional)</label>
                    <select name="class_id" class="mt-1 block w-full rounded-md border-gray-300">
                        <option value="">No class</option>
                        @foreach($classes as $class)
                            <option value="{{ $class->id }}">{{ $class->name }}</option>
                        @endforeach
                    </select>
                </div>
                <!-- Grade / Section input removed per user request -->

                <!-- Pre-assign to students removed -->


                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="document.getElementById('generateModal').classList.add('hidden')"
                            class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">Cancel</button>
                    <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Generate</button>
                </div>
            </form>
        </div>
    </div>
</div>

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
// Toast notification utility
function showToast(message, type = 'success', duration = 4000) {
    const toastId = 'toast-' + Date.now();
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.innerHTML = `
        <div class="${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 animate-slide-in" role="status" aria-live="polite">
            <span class="text-lg font-bold">${icon}</span>
            <span>${message}</span>
        </div>
    `;
    
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
        
        // Add animation styles if not already added
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in { animation: slideIn 0.3s ease-out; }
            `;
            document.head.appendChild(style);
        }
    }
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

document.addEventListener('DOMContentLoaded', function() {
    // Trend Chart
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    const trendData = @json($trendData);
    
    new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: trendData.map(d => d.date),
            datasets: [{
                label: 'Validation Attempts',
                data: trendData.map(d => d.count),
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    // Status Chart
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Successful', 'Failed'],
            datasets: [{
                data: [{{ $successCount }}, {{ $failCount }}],
                backgroundColor: [
                    'rgb(34, 197, 94)', // Green
                    'rgb(239, 68, 68)'  // Red
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    const tbody = document.querySelector('tbody');
    const pagination = document.getElementById('pagination');
    
    // Fetch cards
    async function fetchCards(page = 1) {
        const params = new URLSearchParams(window.location.search);
        params.set('page', page);
        
        try {
            const response = await fetch(`{{ route('scratch-cards.index') }}?${params}`, {
                headers: { 'Accept': 'application/json' }
            });
            const data = await response.json();
            
            tbody.innerHTML = data.data.map(card => `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">${card.code}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold">${card.pin}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${card.status === 'unsold' ? 'bg-gray-100 text-gray-800' : 
                              (card.status === 'sold' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800')}">
                            ${card.status.toUpperCase()}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${card.usage_count} / ${card.max_usage}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${card.student && card.student.name ? card.student.name : (card.student_id ? 'Linked' : '-')}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${new Date(card.created_at).toLocaleDateString()}
                    </td>
                </tr>
            `).join('');
            
            // Simple pagination controls could be added here
        } catch (error) {
            console.error('Error fetching cards:', error);
        }
    }
    
    // Initial load
    fetchCards();
    

    // Handle Generate - submit JSON
    document.getElementById('generateForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const form = this;
        // Build a plain object from form fields (no file inputs expected)
        const data = Object.fromEntries(new FormData(form).entries());

        try {
            const response = await fetch('{{ route('scratch-cards.generate.post') }}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const body = await response.json();
                showToast(body.message || 'Cards generated successfully!', 'success');
                document.getElementById('generateModal').classList.add('hidden');
                fetchCards();

            } else {
                let errText = 'Failed to generate cards';
                try {
                    const errBody = await response.json();
                    if (errBody.message) errText = errBody.message;
                    if (errBody.errors) {
                        const messages = Object.values(errBody.errors).flat();
                        if (messages.length) errText = messages.join('\n');
                    }
                } catch (e) {}
                console.error('Generate failed', response.status, response.statusText);
                showToast(errText, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred: ' + (error.message || error), 'error');
        }
    });
});
</script>
@endpush
@endsection


