import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Trash2, 
  User,
  Search,
  Inbox,
  Quote
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import cmsService, { CmsContact } from '../../../services/cms.service';

const ContactManager = () => {
    const { showToast } = useToast();
    const [contacts, setContacts] = useState<CmsContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [selectedContact, setSelectedContact] = useState<CmsContact | null>(null);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const response = await cmsService.getContacts();
            setContacts(response);
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
            showToast('Failed to load inquiries', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await cmsService.markContactAsRead(id);
            setContacts(prev => prev.map(c => c.id === id ? { ...c, isRead: true } : c));
            if (selectedContact?.id === id) {
                setSelectedContact(prev => prev ? { ...prev, isRead: true } : null);
            }
        } catch (error) {
            showToast('Failed to update status', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
        try {
            await cmsService.deleteContact(id);
            setContacts(prev => prev.filter(c => c.id !== id));
            if (selectedContact?.id === id) setSelectedContact(null);
            showToast('Inquiry deleted successfully', 'success');
        } catch (error) {
            showToast('Failed to delete inquiry', 'error');
        }
    };

    const filteredContacts = contacts.filter(c => {
        const matchesSearch = c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (c.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || 
                             (filter === 'unread' && !c.isRead) || 
                             (filter === 'read' && c.isRead);
        return matchesSearch && matchesFilter;
    });

    const unreadCount = contacts.filter(c => !c.isRead).length;

    return (
        <div className="flex flex-col h-[650px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header (Optional, since dashboard has one, but keeping a simple one) */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Contact Inquiries
            {unreadCount > 0 && (
              <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {unreadCount} NEW
              </span>
            )}
          </h2>
        </div>
      </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
                {/* List Column */}
                <div className="lg:col-span-4 flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    {/* Search & Filter */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            {(['all', 'unread', 'read'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                                        filter === f 
                                            ? 'bg-primary-600 text-white shadow-md shadow-primary-100' 
                                            : 'bg-white text-slate-500 border border-slate-100 hover:border-primary-200'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredContacts.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {filteredContacts.map((contact) => (
                                    <button
                                        key={contact.id}
                                        onClick={() => {
                                            setSelectedContact(contact);
                                            if (!contact.isRead) handleMarkAsRead(contact.id);
                                        }}
                                        className={`w-full text-left p-4 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/30 flex gap-4 items-start ${
                                            selectedContact?.id === contact.id ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg transition-colors ${
                                            selectedContact?.id === contact.id 
                                                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600' 
                                                : contact.isRead 
                                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' 
                                                    : 'bg-primary-600 text-white shadow-sm'
                                        }`}>
                                            <Mail size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm font-bold truncate ${contact.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {contact.fullName}
                                                </h4>
                                                {!contact.isRead && (
                                                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate mb-1">{contact.subject || 'General Inquiry'}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">
                                                {new Date(contact.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-30 p-8 text-center">
                                <Inbox size={48} className="mb-4 text-gray-300" />
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">No Inquiries Found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Column */}
                <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                    {selectedContact ? (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Action Bar */}
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30">
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => handleDelete(selectedContact.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Delete Inquiry"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                                <div className="text-[10px] font-black text-slate-400 tracking-tighter uppercase">
                                    Received {new Date(selectedContact.createdAt).toLocaleString()}
                                </div>
                            </div>

                            {/* Message Header */}
                            <div className="p-8 pb-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                {selectedContact.fullName}
                                            </h3>
                                            <p className="text-xs font-medium text-gray-500">
                                                Public Inquiry
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${selectedContact.isRead ? 'bg-gray-100 text-gray-500' : 'bg-primary-100 text-primary-600'}`}>
                                            {selectedContact.isRead ? 'Read' : 'New'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <a href={`mailto:${selectedContact.email}`} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-500 transition-colors group">
                                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-primary-600 border border-gray-100 dark:border-gray-700">
                                            <Mail size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{selectedContact.email}</p>
                                        </div>
                                    </a>
                                    {selectedContact.phone && (
                                        <a href={`tel:${selectedContact.phone}`} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-500 transition-colors group">
                                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-primary-600 border border-gray-100 dark:border-gray-700">
                                                <Phone size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Phone</p>
                                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{selectedContact.phone}</p>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="flex-1 p-8 pt-4 overflow-y-auto">
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                        {selectedContact.subject || 'General Inquiry'}
                                    </h4>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium whitespace-pre-wrap">
                                        {selectedContact.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 p-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <Mail size={32} className="text-gray-300" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-400">Select an inquiry</p>
                                <p className="text-sm text-gray-400">Choose a message from the list to view.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactManager;
