import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useSystem } from '../../context/SystemContext';
import { 
    Calendar, BookOpen, CreditCard, ChevronRight,
    Clock, TrendingUp, CheckCircle, Bell, User as UserIcon, Loader2, Video, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const StudentDashboard: React.FC = () => {
    const { user, selectedChildId, childrenList } = useAuthStore();
    const { formatCurrency } = useSystem();
    const [studentProfile, setStudentProfile] = useState<any>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const isParent = (user?.role || user?.roleObject?.name || '').toLowerCase() === 'parent';

    useEffect(() => {
        const fetchDashboardInfo = async () => {
            try {
                if (isParent) {
                    if (!selectedChildId) return;
                    const childProfile = childrenList.find((c: any) => c.id === selectedChildId);
                    setStudentProfile(childProfile);

                    if (childProfile?.id) {
                        const statsData = await api.getStudentDashboardStats(childProfile.id);
                        setDashboardData(statsData);
                    }
                } else {
                    const profile = await api.getStudentProfile();
                    setStudentProfile(profile);

                    if (profile?.id) {
                        const statsData = await api.getStudentDashboardStats(profile.id);
                        setDashboardData(statsData);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardInfo();
    }, [isParent, selectedChildId, childrenList]);
    
    // Real Data from API or fallbacks
    const stats = dashboardData?.stats || {
        attendance: null,
        feesBalance: 0,
        latestAverage: 0,
        latestAverageTerm: 'No Assessments Yet',
        nextExam: 'None Upcoming',
        nextExamDate: null
    };

    const todayClasses = dashboardData?.todayClasses || [];
    const announcements = dashboardData?.announcements || [];
    const performanceTrend = dashboardData?.performanceTrend || [];
    const pendingAssignments = dashboardData?.pendingAssignments || [];
    const liveClasses = dashboardData?.liveClasses || [];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 fade-in">
            {/* Live Classes Banner */}
            {liveClasses.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse relative overflow-hidden group hover:border-red-300 dark:hover:border-red-700 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-400 dark:bg-red-500/20 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="flex items-center gap-4 relative z-10 w-full">
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl shadow-sm text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                            <Video className="w-7 h-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-red-900 dark:text-red-100 leading-tight">Live Class Now</h3>
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                            </div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-300 truncate">
                                {liveClasses[0].title} <span className="mx-1.5 opacity-50">•</span> {liveClasses[0].subject}
                            </p>
                        </div>
                    </div>
                    <a href={liveClasses[0].meetingUrl} target="_blank" rel="noreferrer" className="px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-500/30 w-full md:w-auto text-center shrink-0 relative z-10">
                        Join Call Offline
                    </a>
                </div>
            )}

            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                         {isParent ? 'Welcome Parent,' : 'Welcome back,'} {user?.firstName}!
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                        <span className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium shadow-sm">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            Admission No: {studentProfile?.admissionNo || user?.username || 'N/A'}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                            Class: {studentProfile?.class?.name || 'Assigned Soon'}
                        </span>
                    </div>
                </div>
                <div className="relative z-10 flex gap-3">
                   <Link to="/students/finance" className="px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition flex items-center shadow-sm hover:shadow hover:-translate-y-0.5 transform duration-200">
                        Make Payment
                   </Link>
                   <Link to="/students/examination/results" className="px-5 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center shadow-sm hover:shadow hover:-translate-y-0.5 transform duration-200">
                        View Results
                   </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Attendance</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {stats.attendance !== null ? `${stats.attendance}%` : 'N/A'}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <p className={`text-sm mt-4 flex items-center font-medium ${stats.attendance === null ? 'text-gray-500 dark:text-gray-400' : stats.attendance >= 90 ? 'text-green-600 dark:text-green-400' : stats.attendance >= 75 ? 'text-yellow-600 dark:text-yellow-500' : 'text-red-600 dark:text-red-400'}`}>
                        {stats.attendance === null ? (
                            <><Clock className="w-4 h-4 mr-1"/> No records yet</>
                        ) : (
                            <><CheckCircle className="w-4 h-4 mr-1"/> {stats.attendance >= 90 ? 'Excellent standing' : stats.attendance >= 75 ? 'Good standing' : 'Needs attention'}</>
                        )}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Latest Average</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{stats.latestAverage}%</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 font-medium">
                        {stats.latestAverageTerm || 'Assessment'}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800 transition-colors group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fee Balance</p>
                            <h3 className={`text-3xl font-bold mt-2 ${stats.feesBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} group-hover:scale-105 transform origin-left transition-transform`}>
                                {formatCurrency(stats.feesBalance)}
                            </h3>
                        </div>
                        <div className={`p-3 rounded-xl transition-colors ${stats.feesBalance > 0 ? 'bg-red-50 dark:bg-red-900/30 group-hover:bg-red-100' : 'bg-green-50 dark:bg-green-900/30 group-hover:bg-green-100'}`}>
                            <CreditCard className={`w-6 h-6 ${stats.feesBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 font-medium">
                        {stats.feesBalance === 0 ? 'Fully Cleared' : 'Outstanding Payment Needed'}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800 transition-colors group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Exam</p>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2 leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{stats.nextExam}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors">
                            <BookOpen className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                    {stats.nextExamDate ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 font-medium flex items-center text-orange-600">
                           <Calendar className="w-4 h-4 mr-1"/> {stats.nextExamDate}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 font-medium">
                           Not Scheduled
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Timetable Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/80">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                                Today's Classes
                            </h2>
                            <Link to="/students/timetable" className="text-sm text-primary-600 font-bold hover:text-primary-700 hover:underline flex items-center">
                                Full Week <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {todayClasses.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center justify-center">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 mb-3 border border-gray-100 dark:border-gray-700 shadow-sm">
                                        <Clock className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">No classes scheduled</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">You have a free day today!</p>
                                </div>
                            ) : (
                                todayClasses.map((cls: any, i: number) => (
                                    <div key={i} className="px-6 py-4 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                        <div className="w-24 text-sm font-bold text-primary-600 dark:text-primary-400 group-hover:scale-105 transition-transform origin-left">
                                            {cls.time}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">{cls.subject}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                                <UserIcon className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {cls.teacher || 'Unassigned'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Academic Performance Trend */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/80">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
                                Academic Trend
                            </h2>
                        </div>
                        <div className="p-6 h-72">
                            {performanceTrend.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-sm font-medium text-gray-500">
                                    No published assessment results yet.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={performanceTrend}>
                                        <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} />
                                        <Tooltip cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                        <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Pending Assignments */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/80">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-primary-500" />
                                Pending Homework
                            </h2>
                            <Link to="/students/homework" className="text-sm text-primary-600 font-bold hover:text-primary-700 hover:underline">
                                View
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {pendingAssignments.length === 0 ? (
                                <div className="p-6 text-center text-sm font-medium text-gray-500 flex flex-col items-center">
                                     <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                     </div>
                                    All clear! No pending assignments.
                                </div>
                            ) : (
                                pendingAssignments.map((hw: any) => {
                                    const isOverdue = new Date(hw.dueDate) < new Date();
                                    const isDueToday = new Date(hw.dueDate).toDateString() === new Date().toDateString();
                                    return (
                                        <div key={hw.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                                                    {hw.subject}
                                                </span>
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                                    isOverdue ? 'bg-red-50 text-red-600 dark:bg-red-900/30' : 
                                                    isDueToday ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30' : 
                                                    'bg-green-50 text-green-600 dark:bg-green-900/30'
                                                }`}>
                                                    {isOverdue ? 'Overdue' : isDueToday ? 'Due Today' : 'Upcoming'}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-2 hover:text-primary-600 cursor-pointer">{hw.title}</h4>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center font-medium">
                                                <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                                Due: {new Date(hw.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Notice Board */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                <Bell className="w-5 h-5 mr-2 text-yellow-500" />
                                Notice Board
                            </h2>
                        </div>
                        <div className="p-5 space-y-5">
                            {announcements.map((ann: any, i: number) => (
                                <div key={i} className="relative pl-5 border-l-2 border-primary-200 dark:border-primary-800 transition-all hover:border-primary-500 group">
                                    <div className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ring-4 ring-white dark:ring-gray-800 ${ann.type === 'warning' ? 'bg-orange-500' : 'bg-primary-500'} group-hover:scale-125 transition-transform`}></div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-wider">{ann.date}</p>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 hover:text-primary-600 cursor-pointer transition-colors leading-relaxed">{ann.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;

