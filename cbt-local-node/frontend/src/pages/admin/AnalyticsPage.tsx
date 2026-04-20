import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import { getAdminAuthConfig } from '../../utils/adminAuth';

const API_BASE = '/api';

type AnalyticsResponse = {
    summary: {
        totalStudents: number;
        submittedCount: number;
        submissionRate: number;
        averageAnsweredQuestions: number;
        averageSecondsPerQuestion: number;
    };
    mostMissed: Array<{
        id: string;
        content: string;
        attempts: number;
        correctnessRate: number | null;
    }>;
    slowestQuestions: Array<{
        id: string;
        content: string;
        avgSecondsToAnswer: number | null;
    }>;
};

const toNumber = (value: unknown, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const formatNumber = (value: unknown, decimals = 1) => toNumber(value).toFixed(decimals);

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${API_BASE}/admin/analytics`, getAdminAuthConfig());
            const payload = res.data || {};
            setData({
                summary: {
                    totalStudents: toNumber(payload?.summary?.totalStudents, 0),
                    submittedCount: toNumber(payload?.summary?.submittedCount, 0),
                    submissionRate: toNumber(payload?.summary?.submissionRate, 0),
                    averageAnsweredQuestions: toNumber(payload?.summary?.averageAnsweredQuestions, 0),
                    averageSecondsPerQuestion: toNumber(payload?.summary?.averageSecondsPerQuestion, 0),
                },
                mostMissed: Array.isArray(payload?.mostMissed) ? payload.mostMissed : [],
                slowestQuestions: Array.isArray(payload?.slowestQuestions) ? payload.slowestQuestions : [],
            });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load analytics');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    return (
        <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded p-5 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Post-Exam Analytics</h2>
                    <p className="text-sm text-gray-500 mt-1">Submission performance, most-missed items, and timing insights.</p>
                </div>
                <button
                    onClick={fetchAnalytics}
                    className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 text-sm">{error}</div>}

            {data && (
                <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <StatCard label="Total Candidates" value={data.summary.totalStudents} />
                        <StatCard label="Submitted" value={data.summary.submittedCount} />
                        <StatCard label="Submission Rate" value={`${formatNumber(data.summary.submissionRate)}%`} />
                        <StatCard label="Avg Answered" value={formatNumber(data.summary.averageAnsweredQuestions)} />
                        <StatCard label="Avg Sec / Q" value={formatNumber(data.summary.averageSecondsPerQuestion)} />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="bg-white border border-gray-200 rounded p-5">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Most Missed Questions</h3>
                            <ul className="space-y-3">
                                {data.mostMissed.length === 0 && <li className="text-sm text-gray-500">No correctness data yet.</li>}
                                {data.mostMissed.map((item, idx) => (
                                    <li key={item.id} className="border border-gray-100 rounded p-3 bg-gray-50">
                                        <p className="text-xs text-gray-500 mb-1">Q{idx + 1} - {item.attempts} attempts</p>
                                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">{item.content}</p>
                                        <p className="text-xs text-rose-700 mt-1">
                                            Correctness: {item.correctnessRate === null ? 'N/A' : `${formatNumber(item.correctnessRate)}%`}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white border border-gray-200 rounded p-5">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Slowest Questions</h3>
                            <ul className="space-y-3">
                                {data.slowestQuestions.length === 0 && <li className="text-sm text-gray-500">No timing data yet.</li>}
                                {data.slowestQuestions.map((item, idx) => (
                                    <li key={item.id} className="border border-gray-100 rounded p-3 bg-gray-50">
                                        <p className="text-xs text-gray-500 mb-1">Q{idx + 1}</p>
                                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">{item.content}</p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Avg time: {item.avgSecondsToAnswer === null ? 'N/A' : `${formatNumber(item.avgSecondsToAnswer)} sec`}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-white border border-gray-200 rounded p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
    );
}
