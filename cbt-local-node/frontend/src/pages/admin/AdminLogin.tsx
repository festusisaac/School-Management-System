import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { applyAdminAuthDefaults, setAdminToken } from '../../utils/adminAuth';

const API_BASE = '/api';

export default function AdminLogin() {
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${API_BASE}/auth/admin`, { passcode });
            setAdminToken(res.data.token);
            applyAdminAuthDefaults();
            navigate('/admin/pull');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid passcode');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <div className="max-w-sm w-full bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-blue-900 px-6 py-5">
                    <h2 className="text-white text-lg font-bold uppercase tracking-wide">Admin Console Login</h2>
                    <p className="text-blue-200 text-xs mt-1">CBT Examination Node</p>
                </div>

                <div className="p-6">
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded">
                        <div className="flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 text-blue-700 mt-0.5" />
                            <p className="text-xs text-blue-900">Use your administrator passcode to access monitoring and synchronization tools.</p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Passcode</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="password"
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 rounded border border-gray-300 bg-gray-50 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter passcode"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !passcode}
                            className="w-full py-2.5 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Authenticating...' : 'Login'}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
