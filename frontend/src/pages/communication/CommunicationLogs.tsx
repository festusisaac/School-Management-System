import { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  ExternalLink,
  ChevronRight,
  User,
  Users
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';

const CommunicationLogs = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getCommunicationLogs();
      setLogs(data);
    } catch (error) {
      toast.showError('Failed to load communication logs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPENED': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'SENT': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
      case 'SCHEDULED': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'BOUNCED': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredLogs = logs.filter(log => 
    log.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.body?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Communication History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track delivery and engagement for all outbound broadcats</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
                type="text"
                placeholder="Search recipients or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none w-64 shadow-sm"
             />
           </div>
           <button 
              onClick={fetchLogs}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
           >
             <History size={20} className="text-gray-500" />
           </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Messages', value: logs.length, icon: History, color: 'text-gray-600' },
          { label: 'Delivered', value: logs.filter(l => l.status === 'DELIVERED' || l.status === 'OPENED').length, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Opened', value: logs.filter(l => l.status === 'OPENED').length, icon: Eye, color: 'text-blue-600' },
          { label: 'Scheduled', value: logs.filter(l => l.status === 'SCHEDULED').length, icon: Clock, color: 'text-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
              <stat.icon size={16} className={stat.color} />
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Channel</th>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Subject / Content</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timeline</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="animate-spin h-8 w-8 border-b-2 border-primary-600 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Fetching Logs...</p>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.type === 'EMAIL' ? (
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><Mail size={16} /></div>
                        ) : (
                          <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg"><MessageSquare size={16} /></div>
                        )}
                        <span className="text-xs font-bold">{log.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                         <span className="text-sm font-bold text-gray-900 dark:text-white">{log.recipient}</span>
                         {log.studentId && (
                           <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                             <User size={10} /> Link: Student Profile
                           </span>
                         )}
                       </div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                       <div className="flex flex-col gap-0.5 truncate">
                         {log.subject && <span className="text-xs font-black text-gray-700 dark:text-gray-200 truncate">{log.subject}</span>}
                         <span className="text-xs text-gray-500 dark:text-gray-400 truncate italic">"{log.body}"</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={cn(
                         "px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest",
                         getStatusColor(log.status)
                       )}>
                         {log.status}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                         <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                           <Calendar size={10} /> Scheduled: {log.scheduledAt ? format(new Date(log.scheduledAt), 'MMM d, h:mm a') : 'Instant'}
                         </span>
                         {log.openedAt && (
                           <span className="text-[10px] text-blue-500 font-black flex items-center gap-1">
                             <Eye size={10} /> Opened: {format(new Date(log.openedAt), 'h:mm a')}
                           </span>
                         )}
                         {log.deliveredAt && (
                            <span className="text-[10px] text-emerald-500 font-black flex items-center gap-1">
                              <CheckCircle2 size={10} /> Del: {format(new Date(log.deliveredAt), 'h:mm a')}
                            </span>
                         )}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-primary-600 transition-colors">
                         <ChevronRight size={18} />
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                     <History size={48} className="mx-auto mb-4 opacity-10" />
                     <p className="font-bold uppercase tracking-widest text-xs">No activity found</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommunicationLogs;
