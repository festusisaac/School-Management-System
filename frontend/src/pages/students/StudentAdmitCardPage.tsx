import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Printer, AlertTriangle, Layout, Table as TableIcon, Info } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import BatchPrintView from '../examination/setup/admit-cards/BatchPrintView';
import AdmitCardRenderer from '../examination/setup/admit-cards/AdmitCardRenderer';

const StudentAdmitCardPage = () => {
    const { user } = useAuthStore();
    const { showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [selectedExamGroup, setSelectedExamGroup] = useState<any>(null);
    const [printTemplate, setPrintTemplate] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
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
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-10 text-center border border-red-100 dark:border-red-900/30">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-900 dark:text-red-400 mb-2">Error Loading Data</h2>
                    <p className="text-red-700 dark:text-red-500/80 max-w-sm mx-auto mb-6">
                        {error}
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all"
                    >
                        Retry Now
                    </button>
                </div>
            </div>
        );
    }

    if (!dashboardData || !dashboardData.examGroups || dashboardData.examGroups.length === 0) {
        return (
            <div className="p-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Upcoming Exams</h2>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        There are currently no active examinations scheduled for your class. Check back later.
                    </p>
                </div>
            </div>
        );
    }

    const { student, examGroups, schedules = [], admitCards = [] } = dashboardData;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Examination Admit Cards</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        View your upcoming examination schedules and print your admit cards.
                    </p>
                </div>
            </div>

            {/* Exam Groups */}
            {/* Exam Groups / Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-800">
                {examGroups.map((group: any) => (
                    <button
                        key={group.id}
                        onClick={() => setActiveGroupId(group.id)}
                        className={`px-6 py-3 text-sm font-bold transition-all relative ${
                            activeGroupId === group.id 
                                ? 'text-primary-600' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        {group.name}
                        {activeGroupId === group.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Active Group Content */}
            {activeGroupId && (() => {
                const group = examGroups.find((g: any) => g.id === activeGroupId);
                if (!group) return <div className="p-8 text-center text-gray-400">Exam group not found.</div>;

                const groupSchedules = Array.isArray(schedules) ? schedules.filter((s: any) => (s.examGroupId === activeGroupId || s.exam?.examGroupId === activeGroupId)) : [];
                const groupAdmitCard = Array.isArray(admitCards) ? admitCards.find((ac: any) => ac.examGroupId === activeGroupId && ac.isActive) : null;

                return (
                    <div className="space-y-6">
                        {/* Summary & View Toggle */}
                        <div className="flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/10 rounded-lg">
                                    <Info className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{group.academicYear} | {group.term}</p>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{group.name}</h3>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                <button
                                    onClick={() => setViewMode('card')}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                        viewMode === 'card' 
                                            ? 'bg-white dark:bg-gray-900 text-primary-600 shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                    }`}
                                >
                                    <Layout className="w-3.5 h-3.5" />
                                    Card View
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                        viewMode === 'table' 
                                            ? 'bg-white dark:bg-gray-900 text-primary-600 shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                    }`}
                                >
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
                                                onClick={() => {
                                                    setSelectedExamGroup(group.id);
                                                    setPrintTemplate(groupAdmitCard.template);
                                                }}
                                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-primary-600 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg active:scale-95"
                                            >
                                                <Printer className="w-4 h-4" />
                                                Print Admit Card
                                            </button>
                                        </div>
                                        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 sm:p-12 rounded-[2rem] border-4 border-dashed border-gray-200 dark:border-gray-800 flex justify-center overflow-x-auto">
                                            <div className="shrink-0 scale-90 sm:scale-100 origin-top">
                                                <AdmitCardRenderer
                                                    sections={groupAdmitCard.template.sections}
                                                    config={groupAdmitCard.template.config}
                                                    student={student}
                                                    schedules={groupSchedules}
                                                    isPreview={true}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-[800px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl p-12 rounded-[2rem] text-center relative overflow-hidden">
                                        {/* Background Decor */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-bl-full pointer-events-none" />
                                        
                                        <div className="relative z-10">
                                            {dashboardData.settings?.primaryLogo && (
                                                <img 
                                                    src={api.getFileUrl(dashboardData.settings.primaryLogo)} 
                                                    className="h-16 mx-auto mb-6 grayscale opacity-50" 
                                                    alt="School Logo" 
                                                />
                                            )}
                                            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Admit Card Not Ready</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                                                The official admit card for <span className="text-primary-600 font-bold">{group.name}</span> hasn't been generated yet for your class. 
                                            </p>
                                            
                                            <div className="mt-8 flex flex-col items-center gap-4">
                                                <button 
                                                    onClick={() => setViewMode('table')}
                                                    className="px-6 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-xl hover:bg-gray-100 transition-all border border-gray-200 dark:border-gray-700"
                                                >
                                                    View Detailed Schedule
                                                </button>
                                                <p className="text-[10px] text-gray-400 italic">Please contact the examination office for more information.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800/50 rounded-2xl overflow-hidden p-6">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                                    <TableIcon className="w-4 h-4 text-primary-600" />
                                    Detailed Schedule
                                </h4>
                                {groupSchedules.length > 0 ? (
                                    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                                <tr>
                                                    <th className="px-6 py-4">Subject</th>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Time</th>
                                                    <th className="px-6 py-4">Venue</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {groupSchedules.map((schedule: any) => (
                                                    <tr key={schedule.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                            {schedule.subject?.name}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">
                                                            {new Date(schedule.examDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium font-mono text-xs">
                                                            {schedule.startTime} - {schedule.endTime}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 italic">
                                                            {schedule.roomNumber || 'Main Examination Hall'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-gray-400">
                                        No schedules have been published for this session.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Print Portal using existing component */}
            {printTemplate && (
                <BatchPrintView 
                    template={printTemplate}
                    students={[student]} // Only the current student
                    schedules={schedules.filter((s: any) => s.examGroupId === selectedExamGroup)}
                    onClose={() => setPrintTemplate(null)}
                />
            )}
        </div>
    );
};

export default StudentAdmitCardPage;
