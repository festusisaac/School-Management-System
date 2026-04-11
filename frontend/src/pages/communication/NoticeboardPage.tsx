import { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  AlertTriangle,
  Info,
  Megaphone,
  Clock,
  Pin,
  Download
} from 'lucide-react';
import { api, Notice, NoticeType, NoticePriority, NoticeAudience } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useSystem } from '../../context/SystemContext';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export default function NoticeboardPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const { user, selectedChildId } = useAuthStore();
  const { activeSectionId } = useSystem();

  const userRole = (user?.role || user?.roleObject?.name || 'student').toLowerCase();
  const audience = userRole === 'student' || userRole === 'parent' ? NoticeAudience.STUDENTS : NoticeAudience.STAFF;

  useEffect(() => {
    fetchNotices();
  }, [activeSectionId, selectedChildId]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const data = await api.getNotices({ 
        audience,
        schoolSectionId: activeSectionId || undefined
      });
      setNotices(data);
    } catch (error) {
      console.error('Failed to fetch notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityStyles = (priority: NoticePriority) => {
    switch (priority) {
      case NoticePriority.CRITICAL: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case NoticePriority.HIGH: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case NoticePriority.MEDIUM: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case NoticePriority.LOW: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: NoticeType) => {
    switch (type) {
      case NoticeType.EMERGENCY: return <AlertTriangle size={18} />;
      case NoticeType.ACADEMIC: return <Info size={18} />;
      case NoticeType.EVENT: return <Megaphone size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          notice.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || notice.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Noticeboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Stay updated with official school announcements</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary-500" size={18} />
            <input 
              type="text"
              placeholder="Search notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white transition-all text-sm shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        {['All', 'Announcement', 'Academic', 'Event', 'Emergency'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              filterType === type 
                ? "bg-primary-600 text-white shadow-sm" 
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            {type === 'Announcement' ? 'General' : type}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredNotices.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotices.map((notice) => (
            <div 
              key={notice.id}
              className={clsx(
                "group relative bg-white dark:bg-gray-800 border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg flex flex-col",
                notice.isSticky 
                  ? "border-primary-500/30 shadow-sm shadow-primary-500/5 ring-1 ring-primary-500/20" 
                  : "border-gray-200 dark:border-gray-700 shadow-sm"
              )}
            >
              {notice.isSticky && (
                <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 px-3 py-1 bg-primary-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary-600/20">
                  <Pin size={12} className="fill-current" /> PINNED
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className={clsx(
                  "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                  getPriorityStyles(notice.priority)
                )}>
                  {notice.priority}
                </span>
                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase flex items-center gap-1.5">
                  <Clock size={12} /> {format(new Date(notice.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>

              <div className="space-y-3 flex-grow">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-primary-600 transition-colors">
                    {notice.title}
                  </h3>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-400 group-hover:text-primary-600 transition-colors">
                    {getTypeIcon(notice.type)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-4">
                  {notice.content}
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-xs">
                    {(notice.author?.firstName?.charAt(0) || 'A').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {notice.author ? `${notice.author.firstName} ${notice.author.lastName}` : 'Administrator'}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {format(new Date(notice.createdAt), 'h:mm a')}
                    </p>
                  </div>
                </div>
                
                {notice.attachments && notice.attachments.length > 0 && (
                  <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                    <Download size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-center px-6 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-700 mb-4">
            <Bell size={32} className="opacity-20" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Clean Slate!</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm text-sm">
            There are no active notices for your audience right now. Check back later for updates.
          </p>
        </div>
      )}

      {/* Pro-Tips section */}
      <div className="bg-primary-600 rounded-xl p-6 text-white relative overflow-hidden shadow-lg shadow-primary-600/20">
         <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-md flex-shrink-0">
               <Megaphone size={24} />
            </div>
            <div>
               <h3 className="font-bold">Official Announcements</h3>
               <p className="text-xs opacity-90 leading-relaxed max-w-2xl mt-1">
                 You are viewing the official noticeboard. High-priority items are pinned to the top and highlighted in blue. 
                 Emergency maintenance or academic schedule changes will always appear here first.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
