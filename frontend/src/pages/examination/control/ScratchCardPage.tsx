import React, { useState, useEffect } from 'react';
import { 
    Save, Trash2, Printer, Search, 
    RefreshCw, Layers, CreditCard, Download, 
    CheckCircle,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useSystem } from '../../../context/SystemContext';
import { examinationService, ScratchCard, ScratchCardBatch } from '../../../services/examinationService';
import { systemService, AcademicSession } from '../../../services/systemService';
import { format } from 'date-fns';

const ScratchCardPage = () => {
    const { settings } = useSystem();
    const [activeTab, setActiveTab] = useState<'generate' | 'batches' | 'all'>('batches');
    const [loading, setLoading] = useState(false);
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    
    // Generation State
    const [genForm, setGenForm] = useState({
        quantity: 50,
        value: 1000,
        expiryDate: '',
        maxUsage: 5,
        sessionId: '',
        batchName: '',
        codePrefix: 'SC-',
        codeSuffix: '',
        codeLength: 12,
        codeCharset: 'alnum' as 'alnum' | 'numeric' | 'hex',
        pinLength: 8,
        pinCharset: 'numeric' as 'alnum' | 'numeric' | 'hex'
    });

    // Batches State
    const [batches, setBatches] = useState<ScratchCardBatch[]>([]);
    
    // Cards List State
    const [cards, setCards] = useState<ScratchCard[]>([]);
    const [totalCards, setTotalCards] = useState(0);
    const [printCards, setPrintCards] = useState<ScratchCard[]>([]);
    const [filters, setFilters] = useState({
        status: '',
        batchId: '',
        sessionId: '',
        search: '',
        page: 1,
        limit: 20
    });

    const { showSuccess, showError } = useToast();

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (activeTab === 'batches') fetchBatches();
        if (activeTab === 'all') fetchCards();
    }, [activeTab, filters.page, filters.status, filters.batchId, filters.sessionId]);

    const fetchInitialData = async () => {
        try {
            const sessionsData = await systemService.getSessions();
            setSessions(sessionsData);
            if (sessionsData.length > 0) {
                const active = sessionsData.find(s => s.isActive) || sessionsData[0];
                setGenForm(prev => ({ ...prev, sessionId: active.id }));
            }
        } catch (error) {
            showError('Failed to load initial data');
        }
    };

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

    const fetchCards = async () => {
        setLoading(true);
        try {
            const data = await examinationService.getScratchCards(filters);
            setCards(data.items);
            setTotalCards(data.total);
        } catch (error) {
            showError('Failed to load cards');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await examinationService.generateScratchCards(genForm);
            showSuccess('Scratch cards generated successfully');
            setActiveTab('batches');
            fetchBatches();
        } catch (error) {
            showError('Failed to generate scratch cards');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCard = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this card?')) return;
        try {
            await examinationService.deleteScratchCard(id);
            showSuccess('Card deleted');
            fetchCards();
        } catch (error) {
            showError('Failed to delete card');
        }
    };

    const handleSellCard = async (id: string) => {
        try {
            await examinationService.sellScratchCard(id);
            showSuccess('Card marked as sold');
            fetchCards();
        } catch (error) {
            showError('Failed to update card');
        }
    };

    const handlePrintBatch = async (batchId: string) => {
        setLoading(true);
        try {
            const data = await examinationService.getScratchCards({ batchId, limit: 1000 });
            setPrintCards(data.items);
            setTimeout(() => {
                window.print();
                setPrintCards([]);
            }, 500);
        } catch (error) {
            showError('Failed to load cards for printing');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'unsold': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Unsold</span>;
            case 'sold': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Sold</span>;
            case 'redeemed': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Redeemed</span>;
            case 'inactive': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Inactive</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{status}</span>;
        }
    };

    const renderGenerateTab = () => (
        <form onSubmit={handleGenerate} className="max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary-500" />
                    Batch Configuration
                </h3>
                <p className="text-sm text-gray-500 mt-1">Configure how cards in this batch should be generated.</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Basic Information</h4>
                    <div>
                        <label className="block text-sm font-medium mb-1">Academic Session</label>
                        <select 
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                            value={genForm.sessionId}
                            onChange={(e) => setGenForm({...genForm, sessionId: e.target.value})}
                            required
                        >
                            <option value="">Select Session</option>
                            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Batch Name (Optional)</label>
                        <input 
                            type="text" 
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                            placeholder="e.g. 2024 First Term Cards"
                            value={genForm.batchName}
                            onChange={(e) => setGenForm({...genForm, batchName: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Quantity</label>
                            <input 
                                type="number" 
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                value={genForm.quantity}
                                onChange={(e) => setGenForm({...genForm, quantity: Number(e.target.value)})}
                                min="1" max="1000" required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Value (Price)</label>
                            <input 
                                type="number" 
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                value={genForm.value}
                                onChange={(e) => setGenForm({...genForm, value: Number(e.target.value)})}
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Secure Config */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Code & PIN Security</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Code Prefix</label>
                            <input 
                                type="text" 
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                value={genForm.codePrefix}
                                onChange={(e) => setGenForm({...genForm, codePrefix: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Code Length</label>
                            <input 
                                type="number" 
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                value={genForm.codeLength}
                                onChange={(e) => setGenForm({...genForm, codeLength: Number(e.target.value)})}
                                min="6" max="32"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">PIN Length</label>
                            <input 
                                type="number" 
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                value={genForm.pinLength}
                                onChange={(e) => setGenForm({...genForm, pinLength: Number(e.target.value)})}
                                min="4" max="16"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">PIN Charset</label>
                            <select 
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                value={genForm.pinCharset}
                                onChange={(e) => setGenForm({...genForm, pinCharset: e.target.value as any})}
                            >
                                <option value="numeric">Numeric (0-9)</option>
                                <option value="alnum">Alphanumeric</option>
                                <option value="hex">HEX</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Max Usage Per Card</label>
                        <input 
                            type="number" 
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                            value={genForm.maxUsage}
                            onChange={(e) => setGenForm({...genForm, maxUsage: Number(e.target.value)})}
                            min="1"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button 
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
                >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Generate {genForm.quantity} Cards
                </button>
            </div>
        </form>
    );

    const renderBatchesTab = () => (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 uppercase text-xs font-semibold">
                    <tr>
                        <th className="px-6 py-4">Batch Name</th>
                        <th className="px-6 py-4">Session</th>
                        <th className="px-6 py-4">Quantity</th>
                        <th className="px-6 py-4">Created At</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {batches.map(batch => (
                        <tr key={batch.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="px-6 py-4 font-medium">{batch.name}</td>
                            <td className="px-6 py-4 text-gray-500">{batch.sessionId}</td>
                            <td className="px-6 py-4">{batch.quantity}</td>
                            <td className="px-6 py-4 text-gray-500">{format(new Date(batch.createdAt), 'MMM dd, yyyy')}</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Active</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => {
                                            setFilters({...filters, batchId: batch.id});
                                            setActiveTab('all');
                                        }}
                                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                        title="View Cards"
                                    >
                                        <Layers className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handlePrintBatch(batch.id)}
                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" 
                                        title="Print Batch"
                                    >
                                        <Printer className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {batches.length === 0 && !loading && (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No batches generated yet.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderAllCardsTab = () => (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Search</label>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                            placeholder="Search Serial or PIN..."
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Status</label>
                    <select 
                        className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="">All Status</option>
                        <option value="unsold">Unsold</option>
                        <option value="sold">Sold</option>
                        <option value="redeemed">Redeemed</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Batch</label>
                    <select 
                        className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                        value={filters.batchId}
                        onChange={(e) => setFilters({...filters, batchId: e.target.value})}
                    >
                        <option value="">All Batches</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                <button 
                    onClick={() => {
                        setFilters({ status: '', batchId: '', sessionId: '', search: '', page: 1, limit: 20 });
                        fetchCards();
                    }}
                    className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-4">Serial Number</th>
                            <th className="px-6 py-4">PIN</th>
                            <th className="px-6 py-4">Batch</th>
                            <th className="px-6 py-4">Usage</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {cards.map(card => (
                            <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4 font-mono font-medium">{card.code}</td>
                                <td className="px-6 py-4 font-mono font-bold tracking-widest text-primary-600 dark:text-primary-400">{card.pin}</td>
                                <td className="px-6 py-4 text-gray-500 max-w-[150px] truncate">{card.batch?.name || 'N/A'}</td>
                                <td className="px-6 py-4 text-gray-500">{card.usageCount} / {card.maxUsage}</td>
                                <td className="px-6 py-4">{getStatusBadge(card.status)}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {card.status === 'unsold' && (
                                            <button 
                                                onClick={() => handleSellCard(card.id)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Mark as Sold"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDeleteCard(card.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm">
                    <span className="text-gray-500">Showing {cards.length} of {totalCards} cards</span>
                    <div className="flex gap-2">
                        <button 
                            disabled={filters.page === 1}
                            onClick={() => setFilters({...filters, page: filters.page - 1})}
                            className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                            disabled={filters.page * filters.limit >= totalCards}
                            onClick={() => setFilters({...filters, page: filters.page + 1})}
                            className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Scratch Card Management</h1>
                    <p className="text-sm text-gray-500">Generate and manage access cards for result verification.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                        Export Data
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button 
                    onClick={() => setActiveTab('batches')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'batches' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Batch Management
                </button>
                <button 
                    onClick={() => setActiveTab('all')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    All Cards
                </button>
                <button 
                    onClick={() => setActiveTab('generate')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'generate' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Generate New Batch
                </button>
            </div>

            <div className="mt-6">
                {activeTab === 'generate' && renderGenerateTab()}
                {activeTab === 'batches' && renderBatchesTab()}
                {activeTab === 'all' && renderAllCardsTab()}
            </div>

            {/* Print Layout */}
            <div className="hidden print:block">
                <div className="grid grid-cols-2 gap-4">
                    {printCards.map((card) => (
                        <div key={card.id} className="border-2 border-dashed border-gray-400 p-6 rounded-xl flex flex-col items-center justify-center text-center space-y-3 bg-white">
                            <div className="text-lg font-bold text-gray-800 uppercase tracking-widest border-b pb-2 mb-2 w-full">
                                {settings?.schoolName || 'SCRATCH CARD'}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Serial Number</span>
                                <span className="text-lg font-mono font-black">{card.code}</span>
                            </div>
                            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 w-full relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-stripe opacity-10 pointer-events-none"></div>
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter block mb-1">PIN Number</span>
                                <span className="text-2xl font-mono font-black tracking-[0.2em]">{card.pin}</span>
                            </div>
                            <div className="text-[10px] text-gray-400 italic">
                                Visit the student portal to check your results with this card.
                            </div>
                        </div>
                    ))}
                </div>
                <style>{`
                    @media print {
                        body { background: white !important; }
                        .print-hidden { display: none !important; }
                        @page { margin: 1cm; }
                    }
                    .bg-stripe {
                        background: repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 10px,
                            #ccc 10px,
                            #ccc 20px
                        );
                    }
                `}</style>
            </div>
        </div>
    );
};

export default ScratchCardPage;
