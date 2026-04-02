import { useState, useEffect, useMemo } from 'react';
import { 
  Send, 
  Mail, 
  MessageSquare, 
  Users, 
  Layout, 
  Info,
  CheckCircle2,
  AlertCircle,
  Eye,
  ChevronRight,
  ShieldCheck,
  Search,
  Calendar,
  Wallet,
  Coins
} from 'lucide-react';
import { 
  api, 
  MessageTemplate, 
  MessageTemplateType, 
  BroadcastTarget,
  SendBroadcastDto 
} from '../../services/api';
import { useToast } from '../../context/ToastContext';

const SendBroadcast = () => {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const toast = useToast();

  // Form State
  const [formData, setFormData] = useState<SendBroadcastDto>({
    channel: 'EMAIL',
    target: BroadcastTarget.ALL_STUDENTS,
    targetIds: [],
    templateId: '',
    subject: '',
    body: '',
    includeParents: false,
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [tplData, clsData] = await Promise.all([
        api.getMessageTemplates(),
        api.get('/academics/classes')
      ]);
      setTemplates(tplData);
      setClasses(clsData);
    } catch (error) {
      toast.showError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => t.type === formData.channel);
  }, [templates, formData.channel]);

  const handleChannelChange = (channel: 'EMAIL' | 'SMS') => {
    setFormData(prev => ({
      ...prev,
      channel,
      templateId: '',
      subject: '',
      body: '',
    }));
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId,
        subject: template.subject || '',
        body: template.body,
      }));
    } else {
      setFormData(prev => ({ ...prev, templateId: '', subject: '', body: '' }));
    }
  };

  const handleTargetChange = (target: BroadcastTarget) => {
    setFormData(prev => ({ ...prev, target, targetIds: [] }));
  };

  const toggleTargetId = (id: string) => {
    setFormData(prev => {
      const targetIds = prev.targetIds || [];
      if (targetIds.includes(id)) {
        return { ...prev, targetIds: targetIds.filter(i => i !== id) };
      } else {
        return { ...prev, targetIds: [...targetIds, id] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.channel === 'EMAIL' && !formData.subject && !formData.templateId) {
      toast.showError('Subject is required for Email');
      return;
    }
    if (!formData.body) {
      toast.showError('Message body is required');
      return;
    }
    if ([BroadcastTarget.CLASS, BroadcastTarget.SECTION].includes(formData.target) && (!formData.targetIds || formData.targetIds.length === 0)) {
      toast.showError('Please select at least one class/section');
      return;
    }

    try {
      setSending(true);
      const response = await api.sendBroadcast(formData);
      
      if (formData.scheduledAt) {
          const scheduledTime = new Date(formData.scheduledAt).toLocaleString();
          toast.showSuccess(`Broadcast scheduled! Delivery spooled for ${scheduledTime}.`);
      } else {
          toast.showSuccess(`Broadcast triggered! ${response.queued} messages queued for background delivery.`);
      }
      
      // Reset after success but keep targets
      setFormData(prev => ({
        ...prev,
        templateId: '',
        subject: '',
        body: '',
        scheduledAt: undefined,
      }));
    } catch (error) {
      toast.showError('Failed to trigger broadcast');
    } finally {
      setSending(false);
    }
  };

  // Live Preview Logic
  const previewBody = useMemo(() => {
    let text = formData.body || 'Your message will appear here...';
    const sampleData: Record<string, string> = {
      '{student_name}': 'John Doe',
      '{admission_no}': 'PHJC/2024/001',
      '{class_name}': 'JSS 1',
      '{guardian_name}': 'Mr. Smith',
      '{school_name}': 'PHJC School',
    };

    for (const [key, value] of Object.entries(sampleData)) {
      text = text.replace(new RegExp(key, 'g'), `<span class="bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 px-1 rounded font-bold">${value}</span>`);
    }
    return text;
  }, [formData.body]);

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          New Broadcast
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Send a mass notification to your school community</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Configuration Card */}
        <div className="lg:col-span-2 space-y-6">
          <form id="broadcast-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Channel Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                 <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <ShieldCheck size={16} />
                   1. Select Delivery Channel
                 </h2>
               </div>
               <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button
                   type="button"
                   onClick={() => handleChannelChange('EMAIL')}
                   className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                     formData.channel === 'EMAIL' 
                       ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                       : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                   }`}
                 >
                   <div className={`p-3 rounded-full ${formData.channel === 'EMAIL' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                     <Mail size={32} />
                   </div>
                   <div className="text-center">
                     <span className="block font-bold">Email Message</span>
                     <span className="text-xs opacity-70">Rich text, attachments & subject lines</span>
                   </div>
                   {formData.channel === 'EMAIL' && <CheckCircle2 size={20} className="mt-2" />}
                 </button>

                 <button
                   type="button"
                   onClick={() => handleChannelChange('SMS')}
                   className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                     formData.channel === 'SMS' 
                       ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                       : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                   }`}
                 >
                   <div className={`p-3 rounded-full ${formData.channel === 'SMS' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                     <MessageSquare size={32} />
                   </div>
                   <div className="text-center">
                     <span className="block font-bold">SMS (Text)</span>
                     <span className="text-xs opacity-70">Fast, direct & works without internet</span>
                   </div>
                   {formData.channel === 'SMS' && <CheckCircle2 size={20} className="mt-2" />}
                 </button>
               </div>
            </div>

            {/* 2. Recipients Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                 <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <Users size={16} />
                   2. Target Recipients
                 </h2>
               </div>
               <div className="p-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { id: BroadcastTarget.ALL_STUDENTS, label: 'All Students', icon: Users },
                      { id: BroadcastTarget.CLASS, label: 'Specific Classes', icon: Layout },
                      { id: BroadcastTarget.STAFF, label: 'All Staff', icon: ShieldCheck },
                      { id: BroadcastTarget.DEBTORS_ONLY, label: 'All Debtors', icon: Wallet },
                      { id: BroadcastTarget.PAID_ONLY, label: 'Fully Paid', icon: Coins },
                      // { id: BroadcastTarget.INDIVIDUAL_STUDENTS, label: 'Manual Search', icon: Search },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleTargetChange(t.id)}
                        className={`px-4 py-3 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all ${
                          formData.target === t.id 
                            ? 'bg-primary-600 text-white border-primary-600 shadow-md' 
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary-500'
                        }`}
                      >
                        <t.icon size={18} />
                        {t.label}
                      </button>
                    ))}
                 </div>

                 {formData.target === BroadcastTarget.CLASS && (
                   <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 animate-slide-in">
                     <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Select one or more Classes</label>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                       {classes.map(cls => (
                         <button
                           key={cls.id}
                           type="button"
                           onClick={() => toggleTargetId(cls.id)}
                           className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                             formData.targetIds?.includes(cls.id)
                               ? 'bg-primary-100 text-primary-700 border-primary-500'
                               : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                           }`}
                         >
                           {cls.name}
                         </button>
                       ))}
                     </div>
                   </div>
                 )}

                 <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                   <Info size={16} />
                   <div className="flex items-center gap-4">
                     <span>Who receives the message?</span>
                     <label className="flex items-center gap-2 cursor-pointer ml-4">
                       <input
                         type="checkbox"
                         checked={formData.includeParents}
                         onChange={(e) => setFormData(prev => ({ ...prev, includeParents: e.target.checked }))}
                         className="rounded text-primary-600 focus:ring-primary-500"
                       />
                       <span className="font-bold">Include Parents/Guardians</span>
                     </label>
                   </div>
                 </div>
               </div>
            </div>

            {/* 3. Message Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                 <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <Layout size={16} />
                   3. Message Content
                 </h2>
               </div>
               <div className="p-6 space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Use a Saved Template (Optional)</label>
                   <select
                     value={formData.templateId}
                     onChange={(e) => handleTemplateChange(e.target.value)}
                     className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   >
                     <option value="">-- No Template (Compose Manually) --</option>
                     {filteredTemplates.map(t => (
                       <option key={t.id} value={t.id}>{t.name}</option>
                     ))}
                   </select>
                 </div>

                 {formData.channel === 'EMAIL' && (
                   <div>
                     <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email Subject</label>
                     <input
                       type="text"
                       value={formData.subject}
                       onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                       className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                       placeholder="Enter notification subject"
                     />
                   </div>
                 )}

                 <div>
                    <div className="flex justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message Body</label>
                      {formData.channel === 'SMS' && (
                        <span className="text-[10px] font-bold text-gray-400">
                          {formData.body.length} Chars • {Math.ceil(formData.body.length / 160)} SMS
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={10}
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                      placeholder="Compose your message here..."
                    ></textarea>
                 </div>
               </div>
            </div>

            {/* 4. Scheduling */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                 <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <Calendar size={16} />
                   4. Delivery Schedule
                 </h2>
               </div>
               <div className="p-6">
                 <div className="flex flex-col md:flex-row md:items-center gap-6">
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       className="sr-only peer"
                       checked={!!formData.scheduledAt}
                       onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.checked ? new Date().toISOString().slice(0, 16) : undefined }))}
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                     <span className="ml-3 text-sm font-bold text-gray-700 dark:text-gray-300">Schedule for later</span>
                   </label>

                   {formData.scheduledAt !== undefined && (
                     <div className="flex-1 animate-slide-in">
                       <input
                         type="datetime-local"
                         value={formData.scheduledAt}
                         min={new Date().toISOString().slice(0, 16)}
                         onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                         className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                       />
                       <p className="text-[10px] text-gray-400 mt-2 font-medium italic">Message will be released from the queue at this exact time.</p>
                     </div>
                   )}
                 </div>
               </div>
            </div>
            
            <div className="flex justify-end pt-4">
               <button
                 type="submit"
                 disabled={sending}
                 className={`flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-primary-700 transition-all active:scale-95 ${sending ? 'opacity-70 cursor-not-allowed' : ''}`}
               >
                 {sending ? (
                   <>
                     <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full"></div>
                     Spooling Broadcast...
                   </>
                 ) : (
                   <>
                     <Send size={20} />
                     Send Broadcast Now
                   </>
                 )}
               </button>
            </div>
          </form>
        </div>

        {/* Live Preview Sidebar */}
        <div className="space-y-6">
           <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden sticky top-24">
              <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
                <span className="text-white font-bold flex items-center gap-2">
                  <Eye size={18} />
                  Live Preview
                </span>
                <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-[10px] uppercase font-bold tracking-widest">Sample View</span>
              </div>
              
              <div className="p-0 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">JD</div>
                  <div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Example Recipient</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">John Doe (Student)</div>
                  </div>
                </div>
              </div>

              <div className="p-6 pb-12 space-y-4">
                {formData.channel === 'EMAIL' && (
                  <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Subject</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{formData.subject || '(Subject line will appear here)'}</div>
                  </div>
                )}
                
                <div className="relative">
                   <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Message Body</div>
                   <div 
                      className={`text-sm leading-relaxed ${formData.channel === 'SMS' ? 'font-mono' : ''} text-gray-700 dark:text-gray-300 whitespace-pre-wrap`}
                      dangerouslySetInnerHTML={{ __html: previewBody }}
                   />
                </div>
              </div>

              <div className="m-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                <div className="flex gap-2 text-amber-700 dark:text-amber-300">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <p className="text-[11px] leading-relaxed font-bold">
                    This is a simulation. Highlighted values represent dynamic tags that will vary per recipient.
                  </p>
                </div>
              </div>
           </div>

           <div className="p-6 bg-primary-600 rounded-2xl text-white relative overflow-hidden group shadow-2xl">
              <div className="relative z-10">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <CheckCircle2 size={20} />
                  Safe Delivery
                </h3>
                <p className="text-xs opacity-90 leading-relaxed">
                  Broadcasts are processed in the background. You can navigate away from this page safely after clicking send—the task will continue until completion.
                </p>
              </div>
              <Layout className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default SendBroadcast;
