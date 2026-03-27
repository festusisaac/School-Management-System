import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Clock, Calendar, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import apiService from '../../services/api';

interface TeacherStats {
    totalStudents: number;
    classesToday: number;
    pendingHomework: number;
    attendanceMissing: number;
}

interface TimetablePeriod {
    id: string;
    startTime: string;
    endTime: string;
    subjectName: string;
    className: string;
}

const TeacherDashboard: React.FC = () => {
    const [stats, setStats] = useState<TeacherStats | null>(null);
    const [todayTimetable, setTodayTimetable] = useState<TimetablePeriod[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // In a real implementation, this would be a single optimized endpoint
                const [statsData, timetableData] = await Promise.all([
                    apiService.getTeacherStats(),
                    apiService.getTeacherTodayTimetable()
                ]);
                setStats(statsData);
                setTodayTimetable(timetableData);
            } catch (error) {
                console.error('Failed to fetch teacher dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8 overflow-hidden">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Teacher Dashboard</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome back. Here is your overview for today.</p>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-3">
                    <div className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned Students</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.totalStudents || 0}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Classes Today</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.classesToday || 0}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                            <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Homework</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.pendingHomework || 0}</h3>
                        </div>
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                            <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                    {stats && stats.pendingHomework > 0 && (
                        <div className="mt-3">
                            <Link to="/homework" className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center">
                                Grade now <ArrowRight className="w-3 h-3 ml-1" />
                            </Link>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Registers Missing</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.attendanceMissing || 0}</h3>
                        </div>
                        <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    {stats && stats.attendanceMissing > 0 && (
                        <div className="mt-3">
                            <Link to="/students/attendance/mark" className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center">
                                Mark Attendance <ArrowRight className="w-3 h-3 ml-1" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Classes */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Today's Class Schedule</h2>
                        <Link to="/academics/teachers-timetable" className="text-sm font-medium text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors">
                            Full Timetable
                        </Link>
                    </div>
                    
                    <div className="p-0">
                        {todayTimetable.length > 0 ? (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                {todayTimetable.map((period, idx) => (
                                    <li key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center">
                                        <div className="flex-shrink-0 w-24 text-sm font-bold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 pr-4 mt-1">
                                            <div className="text-primary-600 dark:text-primary-400">{period.startTime}</div>
                                            <div className="text-gray-500 text-xs mt-1">{period.endTime}</div>
                                        </div>
                                        <div className="ml-6 flex-1">
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white">{period.subjectName}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center">
                                                <Users className="w-3.5 h-3.5 mr-1.5" /> {period.className}
                                            </p>
                                        </div>
                                        <div>
                                            {/* Could add a jump to online class button here if it was an online class */}
                                            <button className="text-gray-400 hover:text-primary-600 p-2">
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                                <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                <p className="text-sm font-medium">You have no classes scheduled for today.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                    </div>
                    <div className="p-4 space-y-3">
                        <Link to="/students/attendance/mark" className="flex items-center p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-200 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 group transition-all">
                            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Mark Attendance</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Record daily class presence</p>
                            </div>
                        </Link>

                        <Link to="/homework" className="flex items-center p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-orange-200 hover:bg-orange-50/50 dark:hover:bg-orange-900/20 group transition-all">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Manage Homework</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Create or grade assignments</p>
                            </div>
                        </Link>
                        
                        <Link to="/examination/entry/scoresheet" className="flex items-center p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-200 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 group transition-all">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Enter Exam Scores</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Input marks for latest exams</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
