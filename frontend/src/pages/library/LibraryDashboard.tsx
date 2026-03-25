import React, { useEffect, useState } from 'react';
import { libraryService } from '../../services/library.service';
import { 
  Book, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Users,
  Layers,
  Settings,
  History
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LibraryDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    libraryService.getStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Books', value: stats?.totalBooks || 0, icon: Book, color: 'text-blue-600', bgColor: 'bg-blue-50', link: '/library' },
    { label: 'Active Loans', value: stats?.activeLoans || 0, icon: Clock, color: 'text-green-600', bgColor: 'bg-green-50', link: '/library/overdues' },
    { label: 'Overdue Books', value: stats?.overdueLoans || 0, icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50', link: '/library/overdues' },
    { label: 'Total Authors', value: stats?.totalAuthors || 0, icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-50', link: '/library/authors' },
    { label: 'Total Categories', value: stats?.totalCategories || 0, icon: Layers, color: 'text-amber-600', bgColor: 'bg-amber-50', link: '/library/categories' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Library Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of library inventory and circulation.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{card.value}</h3>
              </div>
              <div className={`p-2.5 rounded-lg ${card.bgColor} ${card.color}`}>
                <card.icon size={20} />
              </div>
            </div>
            <Link to={card.link} className="mt-4 flex items-center text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors">
              Details <ArrowRight size={10} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6">Quick Operations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/library/issue" className="group flex flex-col p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <PlusCircle size={20} />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">Issue Book</span>
              <span className="text-xs text-gray-500 mt-1">Lend a book to a borrower</span>
            </Link>
            <Link to="/library/return" className="group flex flex-col p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Clock size={20} />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">Return Book</span>
              <span className="text-xs text-gray-500 mt-1">Record book return & fines</span>
            </Link>
            <Link to="/library/settings" className="group flex flex-col p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-400 hover:bg-gray-50/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Settings size={20} />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">Settings</span>
              <span className="text-xs text-gray-500 mt-1">Grace periods & fine rates</span>
            </Link>
          </div>
        </div>

        {/* System Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Activity</h2>
            <Link to="/library/overdues" className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400">
              <History size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0"></div>
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">System Monitoring Active</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Automated overdue tracking is running.</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-center">
              <p className="text-[10px] font-bold text-gray-500 italic uppercase">No recent circulation logs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryDashboard;
