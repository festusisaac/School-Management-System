import { useState, useEffect } from 'react';
import { Calendar, Layout, Table as TableIcon, Info, Printer, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import AdmitCardComponent from './components/AdmitCardComponent';
import BatchPrintView from '../examination/setup/admit-cards/BatchPrintView';

const StudentAdmitCardPage = () => {
    const { user } = useAuthStore();
    const { showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [error, setError] = useState<string | null>(null);
    const [printTemplate, setPrintTemplate] = useState<any>(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await api.getStudentExamDashboard(user?.id || 'me');
                setDashboardData(data);
                if (data.examGroups?.length > 0) {
                    setActiveGroupId(data.examGroups[0].id);
                }
            } catch (err: any) {
                console.error('Dashboard error:', err);
                setError(err.message || 'Failed to load examination dashboard');
                showError('Failed to load examination dashboard');
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchDashboard();
    }, [user, showError]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
                <p className="text-red-700 mb-6">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold">Retry</button>
            </div>
        );
    }

    if (!dashboardData || !dashboardData.examGroups?.length) {
        return (
            <div className="p-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Upcoming Exams</h2>
                    <p className="text-gray-500">There are currently no active examinations scheduled for your class.</p>
                </div>
            </div>
        );
    }

    const { student, examGroups, schedules = [], admitCards = [] } = dashboardData;
    const activeGroup = examGroups.find((g: any) => g.id === activeGroupId);
    const groupSchedules = Array.isArray(schedules) ? schedules.filter((s: any) => (s.examGroupId === activeGroupId || s.exam?.examGroupId === activeGroupId)) : [];
    const groupAdmitCard = Array.isArray(admitCards) ? admitCards.find((ac: any) => ac.examGroupId === activeGroupId) : null;

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center mb-6 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Examination Admit Cards</h1>
                    <p className="text-sm text-gray-500">View upcoming schedules and print official documentation.</p>
                </div>
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
                {examGroups.map((group: any) => (
                    <button
                        key={group.id}
                        onClick={() => setActiveGroupId(group.id)}
                        className={`px-6 py-3 text-sm font-bold transition-all relative ${activeGroupId === group.id ? 'text-primary-600' : 'text-gray-500'}`}
                    >
                        {group.name}
                        {activeGroupId === group.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />}
                    </button>
                ))}
            </div>

            {activeGroup && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Info className="w-5 h-5 text-primary-600" />
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{activeGroup.academicYear} | {activeGroup.term}</p>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{activeGroup.name}</h3>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            <button onClick={() => setViewMode('card')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg ${viewMode === 'card' ? 'bg-white dark:bg-gray-900 text-primary-600 shadow-sm' : 'text-gray-500'}`}>
                                <Layout className="w-3.5 h-3.5" />
                                Card View
                            </button>
                            <button onClick={() => setViewMode('table')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg ${viewMode === 'table' ? 'bg-white dark:bg-gray-900 text-primary-600 shadow-sm' : 'text-gray-500'}`}>
                                <TableIcon className="w-3.5 h-3.5" />
                                Schedule View
                            </button>
                        </div>
                    </div>

                    {viewMode === 'card' ? (
                        <div className="flex flex-col items-center">
                            {groupAdmitCard ? (
                                    <div className="w-full max-w-[800px]">
                                        <div className="flex justify-end mb-4">
                                            <button
                                                onClick={() => setPrintTemplate(groupAdmitCard)}
                                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg active:scale-95"
                                            >
                                                <Printer className="w-4 h-4" />
                                                Print Admit Card
                                            </button>
                                        </div>

                                        {/* Desktop View: Full Renderer */}
                                        <div className="hidden sm:flex bg-gray-100 dark:bg-gray-800/50 p-12 rounded-[2rem] border-4 border-dashed border-gray-200 dark:border-gray-800 justify-center overflow-x-auto min-h-[400px]">
                                            <div className="shrink-0 scale-90 lg:scale-100 origin-top">
                                                <AdmitCardComponent
                                                    sections={groupAdmitCard.sections || []}
                                                    config={groupAdmitCard.config || {}}
                                                    student={student}
                                                    schedules={groupSchedules}
                                                    isPreview={true}
                                                />
                                            </div>
                                        </div>

                                        {/* Mobile View: Success Card */}
                                        <div className="sm:hidden bg-gradient-to-br from-primary-600 to-indigo-700 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                            <div className="relative z-10 text-center">
                                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20">
                                                    <Printer className="w-8 h-8 text-white" />
                                                </div>
                                                <h4 className="text-xl font-black mb-2">Admit Card Ready!</h4>
                                                <p className="text-sm text-white/80 leading-relaxed mb-8">
                                                    Your official admit card for <span className="font-bold">{activeGroup.name}</span> has been generated and is ready for printing.
                                                </p>
                                                <button 
                                                    onClick={() => setPrintTemplate(groupAdmitCard)}
                                                    className="w-full py-4 bg-white text-primary-600 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl active:scale-95 transition-all"
                                                >
                                                    Print Now
                                                </button>
                                                <p className="mt-6 text-[10px] uppercase tracking-widest font-bold text-white/40">
                                                    Official Documentation
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                           ) : (
                                <div className="w-full max-w-[800px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl p-16 rounded-[2rem] text-center relative overflow-hidden group">
                                     <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Printer className="w-32 h-32 rotate-12" />
                                     </div>
                                     <div className="relative z-10">
                                        <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                            <AlertTriangle className="w-10 h-10 text-yellow-500" />
                                        </div>
                                        <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Official Admit Card Pending</h4>
                                        <p className="text-base text-gray-500 max-w-sm mx-auto leading-relaxed mb-8">
                                            The administration is currently finalizing the official admit cards for <span className="text-primary-600 font-bold">{activeGroup.name}</span>. 
                                        </p>
                                        
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                            <button 
                                                onClick={() => setViewMode('table')} 
                                                className="w-full sm:w-auto px-8 py-3 bg-gray-900 dark:bg-primary-600 text-white text-sm font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-95"
                                            >
                                                View Detailed Schedule
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setViewMode('table');
                                                    setTimeout(() => window.print(), 500);
                                                }}
                                                className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-all"
                                            >
                                                Print Schedule
                                            </button>
                                        </div>
                                        
                                        <div className="mt-8 pt-8 border-t border-gray-50 dark:border-gray-800">
                                            <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400">
                                                <Info className="w-4 h-4" />
                                                <span>Check back soon for the digital version</span>
                                            </div>
                                        </div>
                                     </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden p-6">
                             <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                                <TableIcon className="w-4 h-4 text-primary-600" />
                                Detailed Schedule
                            </h4>
                            {groupSchedules.length > 0 ? (
                                <div className="overflow-x-auto rounded-xl border border-gray-50 dark:border-gray-800">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 font-bold uppercase text-[9px] tracking-[0.2em]">
                                                <th className="px-6 py-4">Subject</th>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Time</th>
                                                <th className="px-6 py-4">Venue</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {groupSchedules.map((s: any) => (
                                                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{s.subject?.name || s.exam?.subject?.name || '---'}</td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">{s.examDate || s.date ? new Date(s.examDate || s.date).toLocaleDateString() : '---'}</td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-xs">{s.startTime} - {s.endTime}</td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 italic">{s.roomNumber || s.venue || 'Main Hall'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400 italic border-2 border-dashed border-gray-100 rounded-xl">No schedules published.</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {printTemplate && (
                <BatchPrintView 
                    template={printTemplate}
                    students={[student]}
                    schedules={groupSchedules}
                    onClose={() => setPrintTemplate(null)}
                />
            )}
        </div>
    );
};

export default StudentAdmitCardPage;
