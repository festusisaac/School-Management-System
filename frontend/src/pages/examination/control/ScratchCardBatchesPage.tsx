import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Trash2, X, Eye } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { DataTable } from '../../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { examinationService, ScratchCardBatch, ScratchCard } from '../../../services/examinationService';
import api from '../../../services/api';

const ScratchCardBatchesPage = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    
    // Batches
    const [batches, setBatches] = useState<ScratchCardBatch[]>([]);
    
    // Cards Search
    const [cards, setCards] = useState<ScratchCard[]>([]);
    const [cardsVisible, setCardsVisible] = useState(false);
    const [loadingCards, setLoadingCards] = useState(false);
    
    // Filters
    const [batchName, setBatchName] = useState('');
    const [studentQuery, setStudentQuery] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    
    // Autocomplete
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const autocompleteRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Confirmation Modal
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchBatches();

        const handleClickOutside = (event: MouseEvent) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchBatches = async () => {
        setLoading(true);
        try {
            const data = await examinationService.getScratchCardBatches();
            setBatches(data);
        } catch (error) {
            showError('Failed to load batches');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchCards = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoadingCards(true);
        setCardsVisible(true);
        try {
            // Find batch ID if a batch name was provided (assuming we want to simulate the filter)
            // Or our backend supports batchName? Actually we only added `studentId` to backend.
            // Let's filter cards manually if batchName is provided and backend doesn't support it,
            // or we use the search parameter.
            
            // For now, let's just pass search as batchName and studentId
            const response = await examinationService.getScratchCards({
                studentId: selectedStudentId || undefined,
                search: batchName || undefined, // Using search for generic text matching (PIN, code, etc.)
                limit: 100 // Just fetching a large amount for the inline list
            });
            
            // Filter locally by batch name if needed
            let items = response.items || [];
            if (batchName) {
                // If backend search doesn't match batch name, we do it here too
                items = items.filter((item: any) => 
                    item.batch?.name?.toLowerCase().includes(batchName.toLowerCase()) || 
                    item.code?.toLowerCase().includes(batchName.toLowerCase())
                );
            }
            setCards(items);
        } catch (error) {
            showError('Failed to fetch cards');
        } finally {
            setLoadingCards(false);
        }
    };

    const handleClearSearch = () => {
        setBatchName('');
        setStudentQuery('');
        setSelectedStudentId('');
        setCardsVisible(false);
        setCards([]);
    };

    const handleDeleteBatch = async (id: string) => {
        try {
            await examinationService.deleteScratchCardBatch(id);
            showSuccess('Batch deleted successfully');
            setConfirmDelete(null);
            fetchBatches();
            if (cardsVisible) handleSearchCards();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to delete batch');
            setConfirmDelete(null);
        }
    };

    // Autocomplete Logic
    const handleStudentQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setStudentQuery(value);
        setSelectedStudentId(''); // Unset ID if they type something new
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        if (value.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        typingTimeoutRef.current = setTimeout(async () => {
            try {
                // Fetch students using api directly since we know getStudents usually uses keyword
                // Fallback to direct axios request if getStudents doesn't exist
                const response = await (api as any).getStudents ? await (api as any).getStudents({ keyword: value }) : await (api as any).axiosInstance.get('/students', { params: { keyword: value } });
                const students = response?.data || response || [];
                setSuggestions(students);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Autocomplete fetch error", error);
            }
        }, 300);
    };

    const selectStudent = (student: any) => {
        setStudentQuery(`${student.firstName} ${student.lastName || ''} (${student.admissionNo})`);
        setSelectedStudentId(student.id);
        setShowSuggestions(false);
    };

    const batchesColumns: ColumnDef<ScratchCardBatch>[] = [
        {
            accessorKey: 'name',
            header: 'Batch Name',
            cell: ({ row }) => <span className="font-medium text-gray-900 dark:text-white">{row.original.name}</span>
        },
        {
            accessorKey: 'session',
            header: 'Session',
            cell: ({ row }) => <span className="text-gray-500 dark:text-gray-400">{row.original.session?.name || 'N/A'}</span>
        },
        {
            id: 'cards',
            header: 'Cards (Used/Total)',
            cell: ({ row }) => (
                <span className="text-gray-500 dark:text-gray-400">
                    {row.original.usedCards || 0} / {row.original.totalCards || row.original.quantity}
                </span>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${row.original.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {row.original.status ? row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1) : 'Unknown'}
                </span>
            )
        },
        {
            accessorKey: 'createdAt',
            header: 'Created At',
            cell: ({ row }) => <span className="text-gray-500 dark:text-gray-400">{new Date(row.original.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(`/examination/control/scratch-cards/batches/${row.original.id}`)}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors flex items-center gap-1"
                    >
                        <Eye className="w-4 h-4" /> View Details
                    </button>
                    <button 
                        onClick={() => setConfirmDelete(row.original.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors flex items-center gap-1"
                    >
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </div>
            )
        }
    ];

    const cardsColumns: ColumnDef<ScratchCard>[] = [
        {
            accessorKey: 'code',
            header: 'Serial Number',
            cell: ({ row }) => <span className="font-mono text-gray-900 dark:text-white">{row.original.code}</span>
        },
        {
            accessorKey: 'pin',
            header: 'PIN',
            cell: ({ row }) => <span className="font-mono font-bold text-gray-900 dark:text-white">{row.original.pin}</span>
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${row.original.status === 'unsold' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' : row.original.status === 'sold' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                    {row.original.status ? row.original.status.toUpperCase() : 'UNKNOWN'}
                </span>
            )
        },
        {
            id: 'usage',
            header: 'Usage',
            cell: ({ row }) => <span className="text-gray-500 dark:text-gray-400">{row.original.usageCount} / {row.original.maxUsage}</span>
        },
        {
            accessorKey: 'student',
            header: 'Used By',
            cell: ({ row }) => <span className="text-gray-500 dark:text-gray-400">{row.original.student ? `${row.original.student.firstName} ${row.original.student.lastName || ''}` : row.original.studentId ? 'Linked' : '-'}</span>
        },
        {
            accessorKey: 'createdAt',
            header: 'Created At',
            cell: ({ row }) => <span className="text-gray-500 dark:text-gray-400">{new Date(row.original.createdAt).toLocaleString()}</span>
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scratch Card Batches</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage and search through all generated scratch card batches.</p>
                </div>
                <button 
                    onClick={() => navigate('/examination/control/scratch-cards')}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800/50 rounded-xl overflow-hidden">
                {/* Advanced Search */}
                <div className="p-5 border-b border-gray-200 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-800/20">
                    <form onSubmit={handleSearchCards} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Batch Name Filter */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Batch Name</label>
                            <input 
                                type="text" 
                                value={batchName}
                                onChange={(e) => setBatchName(e.target.value)}
                                placeholder="Type a batch name (partial match)" 
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                        </div>

                        {/* Student Autocomplete */}
                        <div className="md:col-span-2 relative space-y-1.5" ref={autocompleteRef}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Used by Student</label>
                            <input 
                                type="text"
                                value={studentQuery}
                                onChange={handleStudentQueryChange}
                                placeholder="Type student name or admission number" 
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                            
                            {/* Autocomplete Dropdown */}
                            {showSuggestions && (
                                <div className="absolute left-0 right-0 top-[100%] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
                                    {suggestions.length === 0 ? (
                                        <div className="p-3 text-sm text-gray-500 dark:text-gray-400">No matches found</div>
                                    ) : (
                                        suggestions.map((student: any) => (
                                            <div 
                                                key={student.id} 
                                                onClick={() => selectStudent(student)}
                                                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                                            >
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {student.firstName} {student.lastName || ''}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    ID: {student.admissionNo}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-end gap-3 md:col-span-3 pt-2">
                            <button 
                                type="submit" 
                                className="bg-gray-800 dark:bg-gray-700 text-white px-5 py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 font-medium transition-colors flex items-center gap-2 text-sm"
                            >
                                <Search className="w-4 h-4" />
                                Search Cards
                            </button>
                            {(batchName || studentQuery || cardsVisible) && (
                                <button 
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors flex items-center gap-2 text-sm"
                                >
                                    <X className="w-4 h-4" />
                                    Clear
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Inline Cards Results */}
                    {cardsVisible && (
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800/50">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Search className="w-5 h-5 text-gray-500" />
                                Search Results
                            </h3>
                            {loadingCards ? (
                                <div className="py-12 flex justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            ) : cards.length === 0 ? (
                                <div className="py-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                    No cards matched your search criteria.
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                                     <DataTable columns={cardsColumns} data={cards} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Batches Table */}
                <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Batches</h3>
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : (
                        <DataTable columns={batchesColumns} data={batches} />
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4 mx-auto">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Are you sure?</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-center text-sm leading-relaxed">
                            This action will permanently delete this batch and <strong>all its associated scratch cards</strong>.<br/>
                            <span className="text-red-500 font-medium">Note: You cannot delete a batch if any cards have been distributed or redeemed.</span>
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteBatch(confirmDelete)}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-red-500/20"
                            >
                                Delete Batch
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScratchCardBatchesPage;
