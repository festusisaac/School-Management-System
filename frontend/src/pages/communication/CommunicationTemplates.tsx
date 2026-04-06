import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Mail, 
  MessageSquare, 
  Edit2, 
  Trash2, 
  Copy, 
  Tag, 
  Info,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react';
import { api, MessageTemplate, MessageTemplateType } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CommunicationTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MessageTemplateType>(MessageTemplateType.EMAIL);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const toast = useToast();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: MessageTemplateType.EMAIL,
    subject: '',
    body: '',
  });

  const placeholders = [
    // Student
    { label: 'Full Name', value: '{student_name}' },
    { label: 'First Name', value: '{first_name}' },
    { label: 'Admission No', value: '{admission_no}' },
    { label: 'Roll Number', value: '{roll_no}' },
    { label: 'Class Name', value: '{class_name}' },
    { label: 'Section Name', value: '{section_name}' },
    // Guardian
    { label: 'Guardian Name', value: '{guardian_name}' },
    { label: 'Guardian Phone', value: '{guardian_phone}' },
    { label: 'Father Name', value: '{father_name}' },
    { label: 'Mother Name', value: '{mother_name}' },
    // Finance
    { label: 'Fee Balance', value: '{fee_balance}' },
    // Staff
    { label: 'Employee ID', value: '{employee_id}' },
    { label: 'Department', value: '{department_name}' },
    // System
    { label: 'School Name', value: '{school_name}' },
    { label: 'School Phone', value: '{school_phone}' },
    { label: 'School Email', value: '{school_email}' },
    { label: 'School Address', value: '{school_address}' },
    { label: 'Portal URL', value: '{portal_url}' },
    { label: 'Active Term', value: '{active_term}' },
    { label: 'Active Session', value: '{active_session}' },
    { label: 'Today\'s Date', value: '{current_date}' },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await api.getMessageTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.showError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (template: MessageTemplate | null = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        type: template.type,
        subject: template.subject || '',
        body: template.body,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        type: activeTab,
        subject: '',
        body: '',
      });
    }
    setShowModal(true);
  };

  const handleDuplicate = async (template: MessageTemplate) => {
    try {
      await api.createMessageTemplate({
        name: `${template.name} (Copy)`,
        type: template.type,
        subject: template.subject,
        body: template.body,
      });
      toast.showSuccess('Template duplicated successfully');
      fetchTemplates();
    } catch (error) {
      toast.showError('Failed to duplicate template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.deleteMessageTemplate(id);
      toast.showSuccess('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      toast.showError('Failed to delete template');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await api.updateMessageTemplate(editingTemplate.id, formData);
        toast.showSuccess('Template updated successfully');
      } else {
        await api.createMessageTemplate(formData);
        toast.showSuccess('Template created successfully');
      }
      setShowModal(false);
      fetchTemplates();
    } catch (error) {
      toast.showError('Failed to save template');
    }
  };

  const [lastFocusedField, setLastFocusedField] = useState<'subject' | 'body'>('body');

  const insertPlaceholder = (value: string) => {
    setFormData(prev => ({
      ...prev,
      [lastFocusedField]: (prev[lastFocusedField] || '') + value
    }));
    toast.showSuccess(`Inserted ${value} into ${lastFocusedField}`);
  };

  const filteredTemplates = templates
    .filter(t => t.type === activeTab)
    .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Communication Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage reusable formats for Email and SMS broadcasts</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm hover:shadow-md active:scale-95 font-semibold"
        >
          <Plus size={20} />
          Create Template
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab(MessageTemplateType.EMAIL)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === MessageTemplateType.EMAIL
                ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <Mail size={18} />
            Email Templates
          </button>
          <button
            onClick={() => setActiveTab(MessageTemplateType.SMS)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === MessageTemplateType.SMS
                ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <MessageSquare size={18} />
            SMS Templates
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Template Grid/Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Tag size={48} className="mx-auto mb-4 opacity-20" />
            <p>No {activeTab.toLowerCase()} templates found.</p>
            <button 
              onClick={() => handleOpenModal()}
              className="mt-4 text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
              Create your first template
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Template Name</th>
                  {activeTab === MessageTemplateType.EMAIL && (
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                  )}
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {template.name}
                      </div>
                    </td>
                    {activeTab === MessageTemplateType.EMAIL && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {template.subject || '—'}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        template.isActive 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDuplicate(template)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md"
                          title="Duplicate"
                        >
                          <Copy size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(template)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(template.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
            
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all animate-slide-in">
              <form onSubmit={handleSubmit}>
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingTemplate ? 'Edit Template' : 'Create New Template'}
                  </h3>
                  <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                    <Plus className="rotate-45" size={24} />
                  </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Form Fields */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Template Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Monthly Fee Reminder"
                          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Message Type</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as MessageTemplateType })}
                          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value={MessageTemplateType.EMAIL}>Email</option>
                          <option value={MessageTemplateType.SMS}>SMS</option>
                        </select>
                      </div>
                    </div>

                    {formData.type === MessageTemplateType.EMAIL && (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email Subject</label>
                        <input
                          type="text"
                          required
                          value={formData.subject}
                          onFocus={() => setLastFocusedField('subject')}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="Enter email subject"
                          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message Body</label>
                        {formData.type === MessageTemplateType.SMS && (
                          <span className="text-[10px] text-gray-400 uppercase font-bold">
                            {formData.body.length} Characters • {Math.ceil(formData.body.length / 160)} SMS
                          </span>
                        )}
                      </div>
                      <textarea
                        required
                        value={formData.body}
                        onFocus={() => setLastFocusedField('body')}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        rows={8}
                        placeholder={formData.type === MessageTemplateType.EMAIL ? "Dear {student_name}, ..." : "Hi {student_name}, ..."}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm leading-relaxed"
                      ></textarea>
                    </div>
                  </div>

                  {/* Placeholder Sidebar */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Tag size={14} />
                      Available Tags
                    </div>
                    <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
                      Click a tag to insert it into the message body at the current cursor position.
                    </p>
                    <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                      {placeholders.map((ph) => (
                        <button
                          key={ph.value}
                          type="button"
                          onClick={() => insertPlaceholder(ph.value)}
                          className="w-full flex items-center justify-between px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-[11px] hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all text-gray-700 dark:text-gray-300 shadow-sm group"
                        >
                          <span className="font-semibold text-left truncate">{ph.label}</span>
                          <span className="text-[9px] font-mono text-gray-400 group-hover:text-primary-500 flex-shrink-0 ml-2">{ph.value}</span>
                        </button>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                        <Info size={14} className="flex-shrink-0 mt-0.5" />
                        Tags will be replaced with real data when the message is sent.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-semibold shadow-md active:scale-95"
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationTemplates;
