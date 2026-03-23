import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useSystem } from '../../context/SystemContext';
import { 
    Calendar, BookOpen, CreditCard, ChevronRight,
    Clock, TrendingUp, CheckCircle, Bell, User as UserIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const { formatCurrency } = useSystem();
    const isParent = (user?.roleObject?.name || user?.role || '').toLowerCase() === 'parent';
    
    // Placeholder Data for now
    const stats = {
        attendance: 95,
        feesBalance: 0,
        latestAverage: 82.5,
        nextExam: 'Mathematics'
    };

    const todayClasses = [
        { time: '08:00 AM', subject: 'Mathematics', teacher: 'Mr. Johnson' },
        { time: '09:00 AM', subject: 'English Language', teacher: 'Mrs. Davis' },
        { time: '10:30 AM', subject: 'Basic Science', teacher: 'Dr. Smith' },
        { time: '11:30 AM', subject: 'Catholic Religious Studies', teacher: 'Rev. Fr. Thomas' },
    ];

    const announcements = [
        { date: 'Oct 24', title: 'Mid-term Break Commences Next Friday', type: 'info' },
        { date: 'Oct 20', title: 'Reminder: Complete Term 1 Fee Payments', type: 'warning' }
    ];

    return (
        <div className="space-y-8">
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
                            Student ID: {user?.username || 'N/A'}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">Class: JSS 1A</span>
                    </div>
                </div>
                <div className="relative z-10 flex gap-3">
                   <Link to="/finance/payments" className="px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition flex items-center shadow-sm hover:shadow hover:-translate-y-0.5 transform duration-200">
                        Make Payment
                   </Link>
                   <Link to="/examination/processing/result-sheet" className="px-5 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center shadow-sm hover:shadow hover:-translate-y-0.5 transform duration-200">
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
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{stats.attendance}%</h3>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <p className="text-sm text-green-600 mt-4 flex items-center font-medium">
                        <CheckCircle className="w-4 h-4 mr-1"/> Excellent standing
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
                        Term 1 Assessment
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 font-medium flex items-center text-orange-600">
                       <Calendar className="w-4 h-4 mr-1"/> Tomorrow, 9:00 AM
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timetable Section */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/80">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                            Today's Classes
                        </h2>
                        <Link to="/academics/class-timetable" className="text-sm text-primary-600 font-bold hover:text-primary-700 hover:underline flex items-center">
                            Full Week <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {todayClasses.map((cls, i) => (
                            <div key={i} className="px-6 py-4 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                <div className="w-24 text-sm font-bold text-primary-600 dark:text-primary-400 group-hover:scale-105 transition-transform origin-left">
                                    {cls.time}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">{cls.subject}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                        <UserIcon className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {cls.teacher}
                                    </p>
                                </div>
                            </div>
                        ))}
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
                    <div className="p-6 space-y-6">
                        {announcements.map((ann, i) => (
                            <div key={i} className="relative pl-5 border-l-2 border-primary-200 dark:border-primary-800 transition-all hover:border-primary-500">
                                <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white dark:ring-gray-800 ${ann.type === 'warning' ? 'bg-orange-500' : 'bg-primary-500'}`}></div>
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider">{ann.date}</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-primary-600 cursor-pointer transition-colors">{ann.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;

