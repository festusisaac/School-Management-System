import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useSystem } from '../../context/SystemContext';
import {
    Users, CreditCard, ChevronRight, GraduationCap,
    Calendar, Bell, Loader2, ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ParentDashboard: React.FC = () => {
    const { user, setSelectedChildId, setChildrenList } = useAuthStore();
    const { formatCurrency } = useSystem();
    const navigate = useNavigate();

    const [children, setChildren] = useState<any[]>([]);
    const [familyStats, setFamilyStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchParentData = async () => {
            try {
                const response = (await api.getMyChildren()) as any;
                const childrenData = Array.isArray(response) ? response : (response?.data || []);

                setChildren(childrenData);
                setChildrenList(childrenData);

                if (childrenData.length > 0) {
                    const statsResponse = (await api.getFamilyFinancials(childrenData[0].id)) as any;
                    const stats = statsResponse?.data || statsResponse;
                    setFamilyStats(stats);
                }
            } catch (error) {
                console.error("Failed to fetch parent dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchParentData();
    }, [setChildrenList]);

    const handleSelectChild = (childId: string) => {
        setSelectedChildId(childId);
        navigate('/dashboard'); // Go to the student-specific dashboard view
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
                <p className="text-gray-500 font-medium">Loading family overview...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Family Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Welcome, {user?.firstName}. Manage your children's academic and financial status here.</p>
            </div>

            {/* Family Financial Summary - Minimal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Family Due</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(familyStats?.totalFamilyBalance || 0)}
                    </h3>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Children Enrolled</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{children.length}</h3>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between group cursor-pointer hover:border-primary-500 transition-colors" onClick={() => navigate('/parent/billing')}>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Accounting</p>
                        <h3 className="text-lg font-bold text-primary-600">Family Billing</h3>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                </div>
            </div>

            {/* Children List */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Your Children</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {children.map((child) => (
                        <div
                            key={child.id}
                            className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row items-center gap-6"
                        >
                            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-400 border border-gray-200 dark:border-gray-600">
                                {child.firstName.charAt(0)}{child.lastName.charAt(0)}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                    {child.firstName} {child.lastName}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    {child.className || 'Unassigned Class'} {child.sectionName ? `• ${child.sectionName}` : ''}
                                </p>

                                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                                    <div className="text-center md:text-left">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attendance</p>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">85%</p>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Balance</p>
                                        <p className={`text-sm font-bold ${parseFloat(child.balance) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {formatCurrency(child.balance)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleSelectChild(child.id)}
                                className="w-full md:w-auto px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white text-sm font-bold rounded-lg hover:bg-black dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                            >
                                Enter Portal
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Links & Notices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-yellow-500" />
                        <h3 className="font-bold text-gray-900 dark:text-white">Recent School Notices</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex gap-4 group cursor-pointer">
                                <div className="w-12 h-12 shrink-0 bg-gray-50 dark:bg-gray-900 rounded-lg flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Apr</span>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">1{i}</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600">Annual Inter-house Sports Competition</h4>
                                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">Details regarding the upcoming sports event for all classes...</p>
                                </div>
                            </div>
                        ))}
                        <Link to="/notices" className="block text-center text-xs font-bold text-primary-600 uppercase tracking-widest pt-2">View All Notices</Link>
                    </div>
                </div>

                <div className="bg-primary-600 rounded-xl p-6 text-white shadow-lg shadow-primary-500/20 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-2">Need Help?</h3>
                        <p className="text-primary-100 text-sm leading-relaxed">Contact the school administration for any technical issues or fee clarifications.</p>
                    </div>
                    <button className="mt-6 w-full py-3 bg-white text-primary-600 rounded-lg text-sm font-bold hover:bg-primary-50 transition-colors">
                        Call Support
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ParentDashboard;
