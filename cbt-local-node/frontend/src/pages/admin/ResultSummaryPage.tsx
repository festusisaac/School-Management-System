import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Download, RefreshCw } from 'lucide-react';
import { getAdminAuthConfig } from '../../utils/adminAuth';

const API_BASE = '/api';

type ResultSummaryResponse = {
    summary: {
        totalCandidates: number;
        submittedCount: number;
        pendingCount: number;
        averageScore: number | null;
        highestScore: number | null;
        lowestScore: number | null;
        maxScore: number;
        hasAnswerKeys: boolean;
        gradedCount: number;
        ungradedSubmittedCount: number;
    };
    distribution: Array<{ band: string; count: number }>;
    candidates: Array<{
        studentId: string;
        admissionNo: string;
        fullName: string;
        status: 'Submitted' | 'In Progress' | 'Not Started';
        score: number | null;
        maxScore: number;
        percentage: number | null;
        answeredCount: number;
        submittedAt: string | null;
    }>;
};

const toNum = (value: unknown, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const fmt = (n: unknown, dp = 1) => toNum(n).toFixed(dp);
const scoreOrNa = (value: number | null | undefined, dp = 1) => (value === null || value === undefined ? 'N/A' : fmt(value, dp));

export default function ResultSummaryPage() {
    const [data, setData] = useState<ResultSummaryResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${API_BASE}/admin/results-summary`, getAdminAuthConfig());
            setData(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load result summary.');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const filteredCandidates = useMemo(() => {
        if (!data?.candidates) return [];
        const q = search.trim().toLowerCase();
        if (!q) return data.candidates;
        return data.candidates.filter((c) =>
            c.fullName.toLowerCase().includes(q) ||
            c.admissionNo.toLowerCase().includes(q) ||
            c.status.toLowerCase().includes(q),
        );
    }, [data, search]);

    const downloadCsv = () => {
        if (!data?.candidates?.length) return;
        const rows = [
            ['Admission No', 'Candidate', 'Status', 'Score', 'Max Score', 'Percentage', 'Answered', 'Submitted At'],
            ...data.candidates.map((c) => [
                c.admissionNo,
                c.fullName,
                c.status,
                c.score === null ? '' : String(c.score),
                String(c.maxScore),
                c.percentage === null ? '' : fmt(c.percentage, 2),
                String(c.answeredCount),
                c.submittedAt ? new Date(c.submittedAt).toLocaleString() : '',
            ]),
        ];

        const csv = rows
            .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cbt-result-summary-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Result Summary</h2>
                    <p className="text-sm text-gray-500 mt-1">Review candidate outcomes before and after pushing to cloud.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={downloadCsv}
                        disabled={!data?.candidates?.length}
                        className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-semibold inline-flex items-center gap-1"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button
                        onClick={load}
                        className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 text-sm">{error}</div>}

            {data && (
                <>
                    {!data.summary.hasAnswerKeys && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-3 text-sm">
                            Local node does not contain answer keys. Submitted scripts are shown as <strong>Ungraded</strong> here.
                            Final scoring happens in the cloud after push/import.
                        </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                        <StatCard label="Total Candidates" value={data.summary.totalCandidates} />
                        <StatCard label="Submitted" value={data.summary.submittedCount} />
                        <StatCard label="Pending" value={data.summary.pendingCount} />
                        <StatCard label="Average Score" value={`${scoreOrNa(data.summary.averageScore)} / ${data.summary.maxScore}`} />
                        <StatCard label="Highest Score" value={`${scoreOrNa(data.summary.highestScore, 0)} / ${data.summary.maxScore}`} />
                        <StatCard label="Lowest Score" value={`${scoreOrNa(data.summary.lowestScore, 0)} / ${data.summary.maxScore}`} />
                    </div>

                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, admission number, or status"
                                className="w-full md:max-w-md rounded border border-gray-300 bg-white text-sm text-gray-700 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Candidate</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Admission No</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Score</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Percent</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Answered</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Submitted At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCandidates.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-6 text-sm text-gray-500 text-center">
                                                No candidates match this filter.
                                            </td>
                                        </tr>
                                    )}
                                    {filteredCandidates.map((c) => (
                                        <tr key={c.studentId} className="border-b last:border-b-0">
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{c.fullName}</td>
                                            <td className="px-4 py-3 text-xs font-mono text-gray-600">{c.admissionNo}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                    c.status === 'Submitted'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : c.status === 'In Progress'
                                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                                                }`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                                {c.score === null ? 'Ungraded' : `${c.score} / ${c.maxScore}`}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-700">
                                                {c.percentage === null ? '-' : `${fmt(c.percentage)}%`}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-700">{c.answeredCount}</td>
                                            <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                                                {c.submittedAt ? new Date(c.submittedAt).toLocaleString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
            <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
        </div>
    );
}
