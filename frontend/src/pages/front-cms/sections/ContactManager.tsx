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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="text-primary-600" size={24} />
                        Contact Inquiries
                        {unreadCount > 0 && (
                            <span className="bg-primary-100 text-primary-600 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                                {unreadCount} NEW
                            </span>
                        )}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        View and manage messages sent from the landing page contact form.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
                {/* List Column */}
                <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Search & Filter */}
                    <div className="p-4 border-b border-slate-50 space-y-3 bg-slate-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Search by name, email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
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

                    {/* Infinite-ish List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-50">
                                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Inquiries...</p>
                            </div>
                        ) : filteredContacts.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {filteredContacts.map((contact) => (
                                    <button
                                        key={contact.id}
                                        onClick={() => {
                                            setSelectedContact(contact);
                                            if (!contact.isRead) handleMarkAsRead(contact.id);
                                        }}
                                        className={`w-full text-left p-4 transition-all hover:bg-slate-50 flex items-start gap-3 group ${
                                            selectedContact?.id === contact.id ? 'bg-primary-50/50 border-l-4 border-l-primary-600' : 'border-l-4 border-l-transparent'
                                        } ${!contact.isRead ? 'bg-blue-50/20' : ''}`}
                                    >
                                        <div className={`p-2 rounded-xl shrink-0 ${!contact.isRead ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <User size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm truncate pr-2 ${!contact.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                                                    {contact.fullName}
                                                </h4>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap pt-0.5">
                                                    {new Date(contact.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 truncate font-medium">
                                                {contact.subject || 'No Subject'}
                                            </p>
                                        </div>
                                        {!contact.isRead && (
                                            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 ring-4 ring-primary-100" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-30 p-8 text-center">
                                <Inbox size={48} className="mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest">No Inquiries Found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Column */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    {selectedContact ? (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Action Bar */}
                            <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
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
                                        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-100">
                                            <User size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 leading-none mb-1">
                                                {selectedContact.fullName}
                                            </h3>
                                            <p className="text-sm font-bold text-primary-600 uppercase tracking-widest">
                                                Prospective Parent / Visitor
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${selectedContact.isRead ? 'bg-slate-100 text-slate-500' : 'bg-primary-100 text-primary-600'}`}>
                                            {selectedContact.isRead ? 'Already Read' : 'New Message'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <a href={`mailto:${selectedContact.email}`} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary-300 transition-colors group">
                                        <div className="p-2 bg-white rounded-lg text-primary-600 shadow-sm group-hover:scale-110 transition-transform">
                                            <Mail size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Email Address</p>
                                            <p className="text-sm font-bold text-slate-700 truncate">{selectedContact.email}</p>
                                        </div>
                                    </a>
                                    {selectedContact.phone && (
                                        <a href={`tel:${selectedContact.phone}`} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary-300 transition-colors group">
                                            <div className="p-2 bg-white rounded-lg text-primary-600 shadow-sm group-hover:scale-110 transition-transform">
                                                <Phone size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Phone Number</p>
                                                <p className="text-sm font-bold text-slate-700 truncate">{selectedContact.phone}</p>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="flex-1 p-8 pt-4 overflow-y-auto">
                                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 relative">
                                    <div className="absolute top-8 left-4 text-slate-200">
                                        <Quote size={40} />
                                    </div>
                                    <div className="relative z-10">
                                        <h4 className="text-lg font-black text-slate-900 mb-4 pl-8">
                                            {selectedContact.subject || 'General Inquiry'}
                                        </h4>
                                        <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap pl-8">
                                            {selectedContact.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 p-12 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                                <Mail size={40} className="text-slate-300" />
                            </div>
                            <div>
                                <p className="text-lg font-black text-slate-400 uppercase tracking-widest">Select an inquiry</p>
                                <p className="text-sm font-medium text-slate-400">Choose a message from the list to read carefully.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactManager;
