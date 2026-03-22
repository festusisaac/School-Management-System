import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Calendar, BookOpen, CreditCard, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const isParent = (user?.roleObject?.name || user?.role || '').toLowerCase() === 'parent';
    
    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {isParent ? 'Parent Portal' : 'Student Portal'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Welcome back, {user?.firstName} {user?.lastName}!
                </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <Link to="/academics/class-timetable" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group flex items-start justify-between">
                    <div>
                        <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg inline-block mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                            <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Class Timetable</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View your weekly schedule and classes.</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-600 transition-colors mt-2" />
                </Link>

                <Link to="/examination/processing/result-sheet" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group flex items-start justify-between">
                    <div>
                        <div className="p-3 bg-secondary-50 dark:bg-secondary-900/30 rounded-lg inline-block mb-4 group-hover:bg-secondary-100 dark:group-hover:bg-secondary-900/50 transition-colors">
                            <BookOpen className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Academic Results</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Check your latest exam scores and performance.</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-secondary-600 transition-colors mt-2" />
                </Link>

                <Link to="/finance/payments" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group flex items-start justify-between">
                    <div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg inline-block mb-4 group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
                            <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Fees History</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review your payment history and outstanding balance.</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-600 transition-colors mt-2" />
                </Link>
            </div>
            
            <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-xl p-6 mt-8">
               <h3 className="text-primary-800 dark:text-primary-300 font-bold mb-2">Have a great day!</h3>
               <p className="text-primary-600 dark:text-primary-400 text-sm">Use the sidebar to navigate to your specific student modules. More features will be added here soon.</p>
            </div>
        </div>
    );
};

export default StudentDashboard;
