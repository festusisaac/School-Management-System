import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { useSystem } from '../../../context/SystemContext';
import { examinationService, ScratchCardBatch, ScratchCard } from '../../../services/examinationService';
import { DataTable } from '../../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { 
    ArrowLeft, Printer, Trash2, ShieldCheck, 
    Calendar, Layers, CheckCircle, RefreshCw 
} from 'lucide-react';

const ScratchCardBatchDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { settings } = useSystem();
    const [loading, setLoading] = useState(true);
    const [batch, setBatch] = useState<ScratchCardBatch | null>(null);
    const [cards, setCards] = useState<ScratchCard[]>([]);
    
    // Pagination for DataTable
    const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0 });
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchBatchData();
        }
    }, [id, pagination.page]);

    const fetchBatchData = async () => {
        setLoading(true);
        try {
            // Fetch batches to find this specific one
            const batches = await examinationService.getScratchCardBatches();
            const currentBatch = batches.find(b => b.id === id);
            
            if (!currentBatch) {
                showError('Batch not found');
                navigate('/examination/control/scratch-cards/batches');
                return;
            }
            setBatch(currentBatch);

            // Fetch cards
            const cardsResponse = await examinationService.getScratchCards({ 
                batchId: id, 
                page: pagination.page, 
                limit: pagination.limit 
            });
            setCards(cardsResponse.items || []);
            setPagination(prev => ({ ...prev, total: cardsResponse.total || 0 }));
            
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to load batch details');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        try {
            await examinationService.deleteScratchCard(cardId);
            showSuccess('Card deleted successfully');
            fetchBatchData();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to delete card');
        } finally {
            setConfirmDelete(null);
        }
    };

    const columns: ColumnDef<ScratchCard>[] = [
        {
            accessorKey: 'code',
            header: 'Serial Number',
            cell: ({ row }) => <span className="font-mono font-medium text-gray-900 dark:text-gray-100">{row.original.code}</span>
        },
        {
            accessorKey: 'pin',
            header: 'PIN',
            cell: ({ row }) => <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{row.original.pin}</span>
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const s = row.original.status.toLowerCase();
                if (s === 'unsold') return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Unused</span>;
                if (s === 'sold') return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Distributed</span>;
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Redeemed</span>;
            }
        },
        {
            id: 'usage',
            header: 'Usage',
            cell: ({ row }) => <span className="text-gray-500 dark:text-gray-400 text-sm">{row.original.usageCount} / {row.original.maxUsage}</span>
        },
        {
            accessorKey: 'student',
            header: 'Linked Student',
            cell: ({ row }) => (
                <span className="text-gray-600 dark:text-gray-300 text-sm">
                    {row.original.student ? `${row.original.student.firstName} ${row.original.student.lastName || ''}` : '-'}
                </span>
            )
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <button 
                    onClick={() => setConfirmDelete(row.original.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete Card"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )
        }
    ];

    if (loading && !batch) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-8 h-8 text-primary-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading batch details...</p>
            </div>
        );
    }

    if (!batch) return null;

    return (
        <div className="space-y-6">
            {/* Header / Breadcrumb - Hidden in Print */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <div className="flex flex-col">
                    <button 
                        onClick={() => navigate('/examination/control/scratch-cards/batches')}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-fit mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Batches
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Layers className="w-6 h-6 text-primary-600" />
                        {batch.name}
                    </h1>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-primary-200 dark:shadow-primary-900/20 active:scale-95"
                >
                    <Printer className="w-4 h-4" /> Print Cards
                </button>
            </div>

            {/* Batch Stats - Hidden in Print */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-500"/> Created</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{new Date(batch.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2"><Layers className="w-4 h-4 text-primary-500"/> Total Cards</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{batch.totalCards || batch.quantity}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary-500"/> Cards Used</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{batch.usedCards || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary-500"/> Target Session</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{batch.session?.name || 'Any Session'}</p>
                </div>
            </div>

            {/* Data Table - Hidden in Print */}
            <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden print:hidden">
                <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary-500" />
                        Batch Cards Inventory
                    </h3>
                </div>
                <div className="p-1">
                    <DataTable columns={columns} data={cards} />
                </div>
            </div>

            {/* Print Layout */}
            <div className="hidden print:block">
                <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-4">
                    <h1 className="text-2xl font-black uppercase">{settings?.schoolName || 'SCRATCH CARD BATCH'}</h1>
                    <p className="text-sm font-medium text-gray-600 mt-1">Batch Identifier: {batch.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Generated: {new Date(batch.createdAt).toLocaleDateString()} | Count: {batch.quantity}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                    {cards.map((card) => (
                        <div key={card.id} className="border-2 border-dashed border-gray-400 p-6 rounded-xl flex flex-col items-center justify-center text-center space-y-3 bg-white" style={{ pageBreakInside: 'avoid' }}>
                            <div className="text-lg font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200 pb-2 mb-2 w-full">
                                {settings?.schoolName || 'ACCESS CARD'}
                            </div>
                            <div className="flex flex-col w-full">
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Serial Number</span>
                                <span className="text-lg font-mono font-black">{card.code}</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg border border-gray-200 w-full relative overflow-hidden mt-1 p-3">
                                <div className="absolute top-0 left-0 w-full h-full bg-stripe opacity-10 pointer-events-none"></div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter block mb-1">Secure PIN</span>
                                <span className="text-2xl font-mono font-black tracking-[0.2em] relative z-10">{card.pin}</span>
                            </div>
                            <div className="text-[9px] font-medium text-gray-400 uppercase mt-2 w-full text-center">
                                VALID FOR {card.maxUsage} USES ONLY. STORE SECURELY.
                            </div>
                        </div>
                    ))}
                </div>
                <style>{`
                    @media print {
                        body { background: white !important; }
                        #root { padding: 0 !important; }
                        @page { margin: 1cm; size: A4; }
                    }
                    .bg-stripe {
                        background: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.1) 5px, rgba(0,0,0,0.1) 10px);
                    }
                `}</style>
            </div>

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] print:hidden">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-4 text-red-600">
                            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold">Delete Card</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this specific scratch card? This cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleDeleteCard(confirmDelete)}
                                className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-red-900/20 active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScratchCardBatchDetailsPage;
