import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import api from '../../../services/api';

const ScratchCardPage = () => {
    const [count, setCount] = useState(10);
    const [maxUsage, setMaxUsage] = useState(5);
    const [loading, setLoading] = useState(false);
    const [generatedCards, setGeneratedCards] = useState<any[]>([]);

    const { showSuccess, showError } = useToast();

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await api.post<any[]>('/examination/control/scratch-cards/generate', {
                count: Number(count),
                maxUsage: Number(maxUsage)
            });
            setGeneratedCards(res);
            showSuccess(`Successfully generated ${res.length} scratch cards`);
        } catch (error) {
            showError('Failed to generate scratch cards');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scratch Card Manager</h1>
                <p className="text-gray-500 dark:text-gray-400">Generate access pins for result checking.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-w-xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generate New Batch</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Cards</label>
                        <input
                            type="number"
                            min="1"
                            max="1000"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Usage per Card</label>
                        <input
                            type="number"
                            min="1"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={maxUsage}
                            onChange={(e) => setMaxUsage(Number(e.target.value))}
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleGenerate}
                            disabled={loading || count < 1}
                            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Generating...' : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Generate Cards
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {generatedCards.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Generated Batch</h3>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Download CSV</button>
                    </div>
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-medium sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">Serial Number</th>
                                    <th className="px-6 py-3">PIN</th>
                                    <th className="px-6 py-3">Max Usage</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {generatedCards.map((card) => (
                                    <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 font-mono">{card.serialNumber}</td>
                                        <td className="px-6 py-4 font-mono font-bold tracking-wider">{card.pin}</td>
                                        <td className="px-6 py-4">{card.maxUsage}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                {card.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScratchCardPage;
