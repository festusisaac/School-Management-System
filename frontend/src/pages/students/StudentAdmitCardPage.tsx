import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Printer, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import BatchPrintView from '../examination/setup/admit-cards/BatchPrintView';

const StudentAdmitCardPage = () => {
    const { user } = useAuthStore();
    const { showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [selectedExamGroup, setSelectedExamGroup] = useState<any>(null);
    const [printTemplate, setPrintTemplate] = useState<any>(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const data = await api.getStudentExamDashboard(user?.id || 'me');
                setDashboardData(data);
            } catch (error) {
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

    if (!dashboardData || !dashboardData.examGroups?.length) {
        return (
            <div className="p-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-800">
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

    const { student, examGroups, schedules, admitCards } = dashboardData;

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
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                    Active Examinations
                </h2>

                {examGroups.map((group: any) => {
                    const groupSchedules = schedules.filter((s: any) => s.examGroupId === group.id);
                    const groupAdmitCard = admitCards.find((ac: any) => ac.examGroupId === group.id && ac.isActive);

                    return (
                        <div key={group.id} className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800/50 rounded-xl overflow-hidden">
                            <div className="p-5 border-b border-gray-200 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-800/20 flex flex-wrap gap-4 justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                                    <p className="text-sm text-gray-500">{group.description || 'Upcoming Examination'}</p>
                                </div>
                                {groupAdmitCard ? (
                                    <button
                                        onClick={() => {
                                            setSelectedExamGroup(group.id);
                                            setPrintTemplate(groupAdmitCard.template);
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Print Admit Card
                                    </button>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 text-xs font-semibold rounded-lg">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Admit Card Pending
                                    </span>
                                )}
                            </div>

                            <div className="p-5">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Exam Schedule</h4>
                                {groupSchedules.length > 0 ? (
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium">
                                                <tr>
                                                    <th className="px-4 py-3">Subject</th>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Time</th>
                                                    <th className="px-4 py-3">Room</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {groupSchedules.map((schedule: any) => (
                                                    <tr key={schedule.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                                                            {schedule.subject?.name}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                                {new Date(schedule.examDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                                {schedule.startTime} - {schedule.endTime}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{schedule.roomNumber || 'TBA'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No schedules published yet for this examination.</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

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
