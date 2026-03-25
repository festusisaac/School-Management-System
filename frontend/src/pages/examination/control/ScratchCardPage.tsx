import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Trash2, Search, 
    RefreshCw, Layers, CreditCard, 
    CheckCircle, X,
    AlertTriangle, History
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useSystem } from '../../../context/SystemContext';

import { examinationService, ScratchCard, ScratchCardBatch, ScratchCardDashboardStats } from '../../../services/examinationService';
import { systemService, AcademicSession } from '../../../services/systemService';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const ScratchCardPage = () => {
    const navigate = useNavigate();
    const { settings } = useSystem();
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [stats, setStats] = useState<ScratchCardDashboardStats | null>(null);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ type: 'card' | 'batch', id: string, message: string } | null>(null);
    
    // Generation State
    const [genForm, setGenForm] = useState({
        quantity: 5,
        value: 1000,
        expiryDate: '',
        maxUsage: 5,
        sessionId: '',
        batchName: '',
        codePrefix: '',
        codeSuffix: '',
        codeLength: 12,
        codeCharset: 'alnum' as 'alnum' | 'numeric' | 'hex',
        pinLength: 8,
        pinCharset: 'numeric' as 'alnum' | 'numeric' | 'hex'
    });

    // Cards List State
    const [cards, setCards] = useState<ScratchCard[]>([]);
    const [filters, setFilters] = useState({
        status: '',
        batchId: '',
        sessionId: '',
        search: '',
        page: 1,
        limit: 20
    });


    useEffect(() => {
        fetchInitialData();
        fetchDashboardStats();
        fetchCards();
    }, []);

    useEffect(() => {
        if (filters.page || filters.status || filters.batchId || filters.sessionId) {
            fetchCards();
        }
    }, [filters.page, filters.status, filters.batchId, filters.sessionId]);

    const fetchInitialData = async () => {
        try {
            const sessionsData = await systemService.getSessions();
            setSessions(sessionsData);
            if (sessionsData.length > 0) {
                const active = sessionsData.find(s => s.isActive) || sessionsData[0];
                setGenForm(prev => ({ 
                    ...prev, 
                    sessionId: active.id,
                    codePrefix: settings?.admissionNumberPrefix || prev.codePrefix || 'SC-'
                }));
            }
        } catch (error) {
            showError('Failed to load initial data');
        }
    };

    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            const data = await examinationService.getScratchCardDashboardStats();
            setStats(data);
        } catch (error) {
            showError('Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    };



    const fetchCards = async () => {
        setLoading(true);
        try {
            const data = await examinationService.getScratchCards(filters);
            setCards(data.items);
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
            const res = await examinationService.generateScratchCards(genForm);
            showSuccess('Scratch cards generated successfully');
            setIsGenerateModalOpen(false);
            
            // Navigate directly to the new batch details page if available
            if (res.batch?.id) {
                navigate(`/examination/control/scratch-cards/batches/${res.batch.id}`);
            } else {
                fetchDashboardStats();
                fetchCards();
            }
        } catch (error) {
            showError('Failed to generate scratch cards');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCard = async (id: string) => {
        try {
            await examinationService.deleteScratchCard(id);
            showSuccess('Card deleted');
            fetchCards();
        } catch (error) {
            showError('Failed to delete card');
        } finally {
            setConfirmDelete(null);
        }
    };

    const renderDashboard = () => {
        if (!stats) return <div className="p-10 text-center text-gray-500">Loading dashboard...</div>;

        const pieData = [
            { name: 'Successful', value: stats.successCount },
            { name: 'Failed', value: stats.failCount },
        ];
        const COLORS = ['#22c55e', '#ef4444'];

        return (
            <div className="space-y-8 pb-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm transition-all hover:shadow-md">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Generated</h3>
                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{stats.totalGenerated.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-800 shadow-sm transition-all hover:shadow-md">
                        <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Distributed</h3>
                        <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">{stats.totalDistributed.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-800 shadow-sm transition-all hover:shadow-md">
                        <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">Total Validations</h3>
                        <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">{stats.totalChecked.toLocaleString()}</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border border-yellow-100 dark:border-yellow-800 shadow-sm transition-all hover:shadow-md">
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Redeemed</h3>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">{stats.totalRedeemed.toLocaleString()}</p>
                            <span className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">{stats.overallWinRate.toFixed(1)}% Used</span>
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                            <History className="w-5 h-5 text-primary-500" />
                            Validation Attempts (7 Days)
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.trendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Success vs Failure
                        </h3>
                        <div className="h-64 flex flex-col items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Second Row: Alerts and Table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Alerts Column */}
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/30">
                            <h3 className="text-sm font-bold text-red-900 dark:text-red-300 uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Suspicious Activity
                            </h3>
                        </div>
                        <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[400px]">
                            {stats.suspiciousActivities.length > 0 ? stats.suspiciousActivities.map((alert, i) => (
                                <div key={i} className="flex gap-3 p-3 rounded-lg bg-red-50/50 dark:bg-red-900/5 border border-red-100 dark:border-red-900/20">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-red-900 dark:text-red-200 font-medium">{alert.message}</p>
                                        <span className="text-[10px] text-red-500 mt-1 block uppercase font-bold">{alert.time}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-gray-400">
                                    <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-10" />
                                    <p className="text-xs">No threats detected.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table Column */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Recent Scratch Cards</h3>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        className="pl-8 pr-3 py-1.5 text-xs rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 w-48"
                                        placeholder="Search codes..."
                                        value={filters.search}
                                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-3">Code</th>
                                        <th className="px-4 py-3">PIN</th>
                                        <th className="px-4 py-3">Usage</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {cards.slice(0, 10).map(card => (
                                        <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono">{card.code}</td>
                                            <td className="px-4 py-3 font-mono font-bold text-primary-600">{card.pin}</td>
                                            <td className="px-4 py-3 text-gray-500">{card.usageCount}/{card.maxUsage}</td>
                                            <td className="px-4 py-3">{getStatusBadge(card.status)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button 
                                                    onClick={() => handleDeleteCard(card.id)}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
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


    return (
        <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 italic tracking-tight flex items-center gap-2">
                        <CreditCard className="w-7 h-7 text-primary-600" />
                        Scratch Card Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Generate and track student result access cards</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => navigate('/examination/control/scratch-cards/batches')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all border border-gray-200 active:scale-95"
                    >
                        <Layers className="w-4 h-4" />
                        View Batches
                    </button>
                    <button 
                        onClick={() => setIsGenerateModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
                    >
                        <CreditCard className="w-4 h-4" />
                        Generate Cards
                    </button>
                </div>
            </div>

            {renderDashboard()}

            {/* Generate Modal */}
            {isGenerateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Generate New Cards</h3>
                                <p className="text-xs text-gray-500 font-medium">Configure security and batch settings</p>
                            </div>
                            <button onClick={() => setIsGenerateModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleGenerate} className="p-6">
                            <div className="space-y-6">
                                {/* Configuration Section */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-primary-500" />
                                        Batch Configuration
                                    </h4>
                                    
                                    <div className="mb-5">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Batch Name
                                        </label>
                                        <input 
                                            type="text" 
                                            className="w-full px-3 py-2.5 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
                                            value={genForm.batchName}
                                            onChange={(e) => setGenForm({...genForm, batchName: e.target.value})}
                                            placeholder="e.g. First Term 2025/2026 Batch"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                Quantity to Generate
                                            </label>
                                            <input 
                                                type="number" 
                                                className="w-full px-3 py-2.5 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
                                                value={genForm.quantity}
                                                onChange={(e) => setGenForm({...genForm, quantity: Number(e.target.value)})}
                                                min="1" max="10000" required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                Card Value (Price)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₦</span>
                                                <input 
                                                    type="number" 
                                                    className="w-full pl-8 pr-3 py-2.5 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
                                                    value={genForm.value}
                                                    onChange={(e) => setGenForm({...genForm, value: Number(e.target.value)})}
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-primary-500" />
                                        Security Settings
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                Code Prefix
                                            </label>
                                            <div className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm font-mono text-gray-700 dark:text-gray-300 cursor-default select-none">
                                                {genForm.codePrefix || settings?.admissionNumberPrefix || 'SC-'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                PIN Length
                                            </label>
                                            <input 
                                                type="number" 
                                                className="w-full px-3 py-2.5 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
                                                value={genForm.pinLength}
                                                onChange={(e) => setGenForm({...genForm, pinLength: Number(e.target.value)})}
                                                min="4" max="15"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                Max Usage per Card
                                            </label>
                                            <input 
                                                type="number" 
                                                className="w-full px-3 py-2.5 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
                                                value={genForm.maxUsage}
                                                onChange={(e) => setGenForm({...genForm, maxUsage: Number(e.target.value)})}
                                                min="1" max="10"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-5 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsGenerateModalOpen(false)} className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    Cancel
                                </button>
                                <button 
                                    disabled={loading}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                    {loading ? 'Generating...' : `Generate ${genForm.quantity} Cards`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center gap-3 mb-4 text-red-600">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold">Please confirm</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">{confirmDelete.message}</p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleDeleteCard(confirmDelete.id)}
                                className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95"
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

export default ScratchCardPage;
