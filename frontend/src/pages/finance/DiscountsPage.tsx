import { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  Plus,
  Trash2,
  Percent,
  Banknote,
  ShieldCheck,
  AlertCircle,
  Search,
  ChevronRight,
  Tag,
  Info,
  X,
  Save,
  Calendar,
  Users,
  Clock
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { clsx } from 'clsx';
import { useToast } from '../../context/ToastContext';

interface FeeHead {
  id: string;
  name: string;
  defaultAmount: string;
  isOptional: boolean;
}

interface DiscountRule {
  id?: string;
  feeHeadId: string;
  feeHead?: FeeHead;
  percentage?: string;
  fixedAmount?: string;
}

interface DiscountProfile {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  expiryDate: string | null;
  rules: DiscountRule[];
}

export default function DiscountsPage() {
  const toast = useToast();
  const [profiles, setProfiles] = useState<DiscountProfile[]>([]);
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [newProfile, setNewProfile] = useState({
    name: '',
    description: '',
    isActive: true,
    expiryDate: '',
    rules: [] as { feeHeadId: string; type: 'percentage' | 'fixed'; value: string }[]
  });

  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningProfile, setAssigningProfile] = useState<DiscountProfile | null>(null);
  const [assignmentData, setAssignmentData] = useState({
    classIds: [] as string[],
    sectionIds: [] as string[],
    categoryIds: [] as string[],
    studentIds: [] as string[],
    excludeIds: [] as string[]
  });
  const [simulationResult, setSimulationResult] = useState<{
    total: number;
    conflicts: number;
    students: any[];
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isAssignModalOpen && assigningProfile) {
      handleSimulate();
    }
  }, [assignmentData.classIds, assignmentData.sectionIds, assignmentData.categoryIds, assignmentData.studentIds]);

  const handleSimulate = async () => {
    if (!assigningProfile) return;
    try {
      setIsSimulating(true);
      const res = await api.simulateDiscountProfile(assigningProfile.id, assignmentData);
      setSimulationResult(res);
    } catch (error) {
      console.error('Simulation failed', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profilesRes, headsRes, classesRes, sectionsRes, catsRes, studentsRes] = await Promise.all([
        api.getDiscountProfiles(),
        api.getFeeHeads(),
        api.getClasses(),
        api.getSections(),
        api.getStudentCategories(),
        api.getStudents()
      ]);
      setProfiles(profilesRes || []);
      setFeeHeads(headsRes || []);
      setClasses(classesRes || []);
      setSections(sectionsRes || []);
      setCategories(catsRes || []);
      setStudents(studentsRes || []);
    } catch (error) {
      console.error('Failed to fetch discount data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = () => {
    setNewProfile(prev => ({
      ...prev,
      rules: [...prev.rules, { feeHeadId: '', type: 'percentage', value: '' }]
    }));
  };

  const handleRemoveRule = (index: number) => {
    setNewProfile(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const handleEdit = (profile: DiscountProfile) => {
    setEditingId(profile.id);
    setNewProfile({
      name: profile.name,
      description: profile.description || '',
      isActive: profile.isActive,
      expiryDate: profile.expiryDate ? new Date(profile.expiryDate).toISOString().split('T')[0] : '',
      rules: profile.rules.map(r => ({
        feeHeadId: r.feeHeadId,
        type: r.percentage ? 'percentage' : 'fixed',
        value: r.percentage || r.fixedAmount || ''
      }))
    });
    setIsModalOpen(true);
  };

  const handleRuleChange = (index: number, field: string, value: any) => {
    setNewProfile(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => i === index ? { ...rule, [field]: value } : rule)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newProfile.name,
        description: newProfile.description,
        isActive: newProfile.isActive,
        expiryDate: newProfile.expiryDate || null,
        rules: newProfile.rules.map(r => ({
          feeHeadId: r.feeHeadId,
          [r.type === 'fixed' ? 'fixedAmount' : 'percentage']: r.value
        }))
      };
      if (editingId) {
        await api.updateDiscountProfile(editingId, payload);
        toast.showSuccess('Discount profile updated successfully');
      } else {
        await api.createDiscountProfile(payload);
        toast.showSuccess('Discount profile created successfully');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNewProfile({ name: '', description: '', isActive: true, rules: [], expiryDate: '' });
      fetchData();
    } catch (error) {
      toast.showError(editingId ? 'Failed to update discount profile' : 'Failed to create discount profile');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;
    try {
      await api.deleteDiscountProfile(id);
      toast.showSuccess('Policy deleted successfully');
      fetchData();
    } catch (error) {
      toast.showError('Failed to delete policy');
    }
  };

  const handleAssign = (profile: DiscountProfile) => {
    setAssigningProfile(profile);
    setAssignmentData({ classIds: [], sectionIds: [], categoryIds: [], studentIds: [], excludeIds: [] });
    setStudentSearch('');
    setSimulationResult(null);
    setIsAssignModalOpen(true);
  };

  const submitAssignment = async () => {
    if (!assigningProfile) return;
    try {
      await api.assignDiscountProfile(assigningProfile.id, assignmentData);
      toast.showSuccess('Policy assigned successfully!');
      setIsAssignModalOpen(false);
      fetchData();
    } catch (error) {
      toast.showError('Failed to assign policy');
    }
  };

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl p-6 rounded-3xl border border-white dark:border-gray-800 shadow-xl shadow-primary-500/5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary-600 rounded-xl shadow-lg shadow-primary-500/30">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discount & Scholarship Policies</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Manage automated reduction rules for specific fee items.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-semibold shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create New Policy
        </button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by policy name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-sm shadow-primary-500/5"
          />
        </div>
        <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-800/50">
          <div className="p-2 bg-white dark:bg-gray-800 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <div className="text-sm text-primary-600/80 font-medium">Active Policies</div>
            <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{profiles.length} Total</div>
          </div>
        </div>
      </div>

      {/* Grid of Policies */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map(profile => (
            <div
              key={profile.id}
              className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{profile.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{profile.description || 'No description provided.'}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Applied Rules</div>
                  <div className="space-y-2">
                    {profile.rules.map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100/50 dark:border-gray-800/50">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{rule.feeHead?.name}</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {rule.percentage ? `- ${rule.percentage}% ` : ` - ${formatCurrency(rule.fixedAmount)} `}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900 border-t border-gray-50 dark:border-gray-800/50 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className={clsx(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    profile.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  )}>
                    {profile.isActive ? 'ACTIVE POLICY' : 'INACTIVE'}
                  </span>
                  {profile.expiryDate && (
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                      new Date(profile.expiryDate) < new Date()
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-blue-100 text-primary-700 dark:bg-blue-900/30 dark:text-blue-400"
                    )}>
                      <Clock className="w-3 h-3" />
                      {new Date(profile.expiryDate) < new Date() ? 'EXPIRED' : `Expires: ${new Date(profile.expiryDate).toLocaleDateString()}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleAssign(profile)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-bold flex items-center gap-1 group/btn"
                  >
                    <Users className="w-4 h-4" />
                    Assign
                  </button>
                  <button
                    onClick={() => handleEdit(profile)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-bold flex items-center gap-1 group/btn"
                  >
                    Edit Rules
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800/50">
          <div className="inline-block p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-lg mb-4">
            <AlertCircle className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No policies found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Start by creating your first automated discount rule.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
          >
            New Policy
          </button>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-900/10 dark:to-gray-900">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingId ? 'Edit Discount Policy' : 'New Discount Policy'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {editingId ? 'Update rules and conditions for this policy.' : 'Define automated rules for this policy profile.'}
                </p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); setNewProfile({ name: '', description: '', isActive: true, rules: [], expiryDate: '' }); }} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1">Policy Name</label>
                    <input
                      type="text"
                      placeholder="e.g. 50% Academic Scholarship"
                      value={newProfile.name}
                      onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1">Description (Internal Note)</label>
                    <textarea
                      placeholder="Who is this policy for? Any special conditions?"
                      rows={2}
                      value={newProfile.description}
                      onChange={(e) => setNewProfile({ ...newProfile, description: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800/50 rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-medium resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-500" />
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={newProfile.expiryDate}
                      onChange={(e) => setNewProfile({ ...newProfile, expiryDate: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800/50 rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-medium"
                    />
                    <p className="mt-2 text-xs text-gray-500 px-1">Policy will automatically stop applying after this date.</p>
                  </div>
                </div>
              </div>

              {/* Rule Builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-primary-600 rounded-full" />
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Rule Configuration</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Rule
                  </button>
                </div>

                <div className="space-y-3">
                  {newProfile.rules.length > 0 ? (
                    newProfile.rules.map((rule, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800/50 animate-in slide-in-from-right duration-300">
                        <div className="col-span-6">
                          <select
                            value={rule.feeHeadId}
                            onChange={(e) => handleRuleChange(idx, 'feeHeadId', e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border-none outline-none text-sm font-bold rounded-xl px-3 py-2 cursor-pointer"
                          >
                            <option value="">Select Fee Head...</option>
                            {feeHeads.map(head => (
                              <option key={head.id} value={head.id}>{head.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <button
                            type="button"
                            onClick={() => handleRuleChange(idx, 'type', rule.type === 'percentage' ? 'fixed' : 'percentage')}
                            className="w-full flex justify-center py-2 bg-white dark:bg-gray-800 rounded-xl"
                          >
                            {rule.type === 'percentage' ? <Percent className="w-4 h-4 text-primary-600" /> : <Banknote className="w-4 h-4 text-emerald-600" />}
                          </button>
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            placeholder="Value"
                            value={rule.value}
                            onChange={(e) => handleRuleChange(idx, 'value', e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border-none outline-none text-sm font-bold rounded-xl px-3 py-2 text-center"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button onClick={() => handleRemoveRule(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Live Preview */}
                        {rule.feeHeadId && rule.value && (
                          <div className="col-span-12 mt-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100/50 dark:border-blue-800/50">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-primary-600 uppercase tracking-widest">
                              <Info className="w-3 h-3" />
                              Live Preview
                            </div>
                            <div className="text-sm font-bold text-gray-700 dark:text-gray-200 mt-0.5">
                              {(() => {
                                const head = feeHeads.find(h => h.id === rule.feeHeadId);
                                if (!head) return 'Invalid Head';
                                const original = parseFloat(head.defaultAmount);
                                let discount = 0;
                                if (rule.type === 'percentage') {
                                  discount = original * (parseFloat(rule.value) / 100);
                                } else {
                                  discount = parseFloat(rule.value);
                                }
                                const final = Math.max(0, original - discount);
                                return `Original: ${formatCurrency(original)} → New: ${formatCurrency(final)}`;
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border-2 border-dashed border-blue-100 dark:border-blue-800/50">
                      <div className="flex flex-col items-center gap-2">
                        <Info className="w-6 h-6 text-blue-400" />
                        <p className="text-xs text-primary-600 font-bold uppercase tracking-widest px-8">No rules added yet. This policy will have no effect.</p>
                        <button onClick={handleAddRule} className="mt-2 text-xs font-bold text-primary-700 bg-white px-4 py-2 rounded-xl shadow-sm">Start Building Now</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-gray-100 dark:border-gray-800/50">
              <div className="flex items-center gap-4 order-2 sm:order-1">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-gray-500 dark:text-gray-400 font-bold hover:bg-white dark:hover:bg-gray-800 rounded-2xl transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!newProfile.name || newProfile.rules.length === 0}
                  className="flex items-center gap-2 px-10 py-3 bg-primary-600 text-white rounded-2xl font-bold shadow-xl shadow-primary-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all cursor-pointer"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Update Policy' : 'Save Policy'}
                </button>
              </div>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <div className={clsx(
                  "w-10 h-6 h rounded-full relative transition-colors cursor-pointer",
                  newProfile.isActive ? "bg-primary-600" : "bg-gray-300"
                )} onClick={() => setNewProfile({ ...newProfile, isActive: !newProfile.isActive })}>
                  <div className={clsx(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                    newProfile.isActive ? "left-5" : "left-1"
                  )} />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Enable Now</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Assignment Modal */}
      {isAssignModalOpen && assigningProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assign Policy: {assigningProfile.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Link this policy to specific student groups or individuals.</p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6">
              {/* Target Classes */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Target Classes</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {classes.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => {
                        const isRemoving = assignmentData.classIds.includes(cls.id);
                        setAssignmentData(prev => ({
                          ...prev,
                          classIds: isRemoving
                            ? prev.classIds.filter(id => id !== cls.id)
                            : [...prev.classIds, cls.id],
                          // Clear sub-filters if the parent class is removed
                          sectionIds: isRemoving
                            ? prev.sectionIds.filter(sid => sections.find(s => s.id === sid)?.classId !== cls.id)
                            : prev.sectionIds
                        }));
                      }}
                      className={clsx(
                        "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                        assignmentData.classIds.includes(cls.id)
                          ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20"
                          : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800/50 hover:bg-gray-100"
                      )}
                    >
                      {cls.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Sections */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Target Sections</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {sections
                    .filter(sec => assignmentData.classIds.length === 0 || assignmentData.classIds.includes(sec.classId))
                    .map(sec => (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setAssignmentData(prev => ({
                            ...prev,
                            sectionIds: prev.sectionIds.includes(sec.id)
                              ? prev.sectionIds.filter(id => id !== sec.id)
                              : [...prev.sectionIds, sec.id]
                          }));
                        }}
                        className={clsx(
                          "px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all",
                          assignmentData.sectionIds.includes(sec.id)
                            ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/20"
                            : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800/50 hover:bg-gray-100"
                        )}
                      >
                        {sec.name} ({classes.find(c => c.id === sec.classId)?.name || 'N/A'})
                      </button>
                    ))}
                  {assignmentData.classIds.length > 0 && sections.filter(sec => assignmentData.classIds.includes(sec.classId)).length === 0 && (
                    <p className="col-span-full text-[10px] text-gray-400 italic">No sections found for selected classes.</p>
                  )}
                </div>
              </div>

              {/* Target Categories */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Student Categories</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setAssignmentData(prev => ({
                          ...prev,
                          categoryIds: prev.categoryIds.includes(cat.id)
                            ? prev.categoryIds.filter(id => id !== cat.id)
                            : [...prev.categoryIds, cat.id]
                        }));
                      }}
                      className={clsx(
                        "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                        assignmentData.categoryIds.includes(cat.id)
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                          : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800/50 hover:bg-gray-100"
                      )}
                    >
                      {cat.category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual Students (Searchable) */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Search & Add Individuals</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={
                      assignmentData.sectionIds.length > 0
                        ? `Search searching in selected sections...`
                        : assignmentData.classIds.length > 0
                          ? `Searching only in ${assignmentData.classIds.map(id => classes.find(c => c.id === id)?.name).join(', ')}...`
                          : "Search by name or admission number..."
                    }
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                {studentSearch && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800/50 rounded-2xl shadow-xl max-h-[150px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
                    {students.filter(s => {
                      const matchesSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        s.admissionNo.toLowerCase().includes(studentSearch.toLowerCase());
                      const matchesClass = assignmentData.classIds.length === 0 || assignmentData.classIds.includes(s.classId);
                      const matchesSection = assignmentData.sectionIds.length === 0 || assignmentData.sectionIds.includes(s.sectionId);
                      return matchesSearch && matchesClass && matchesSection;
                    }).map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setAssignmentData(prev => ({
                            ...prev,
                            studentIds: prev.studentIds.includes(s.id) ? prev.studentIds : [...prev.studentIds, s.id]
                          }));
                          setStudentSearch('');
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{s.firstName} {s.lastName}</p>
                          <p className="text-[10px] text-gray-500 uppercase">{s.admissionNo} • {classes.find(c => c.id === s.classId)?.name || 'No Class'}</p>
                        </div>
                        <Plus className="w-4 h-4 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
                {assignmentData.studentIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {assignmentData.studentIds.map(id => {
                      const student = students.find(s => s.id === id);
                      if (!student) return null;
                      return (
                        <span key={id} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-primary-600 dark:text-blue-400 rounded-xl text-[10px] font-bold border border-blue-100 dark:border-blue-800">
                          {student.firstName} {student.lastName}
                          <button onClick={() => setAssignmentData(prev => ({ ...prev, studentIds: prev.studentIds.filter(sid => sid !== id) }))}>
                            <X className="w-3 h-3 hover:text-red-500" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Simulation Result & Exclusions */}
              {simulationResult && simulationResult.students.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                      Targeted Students ({simulationResult.total - assignmentData.excludeIds.length})
                    </label>
                    {simulationResult.conflicts > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-100 dark:border-amber-800/50">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{simulationResult.conflicts} Policy Conflict(s)</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800/50 divide-y divide-gray-100 dark:divide-gray-700 max-h-[200px] overflow-y-auto font-medium shadow-inner">
                    {simulationResult.students.map(student => (
                      <div key={student.id} className={clsx(
                        "p-3 flex items-center justify-between transition-opacity",
                        assignmentData.excludeIds.includes(student.id) && "opacity-40"
                      )}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{student.name}</span>
                            <span className="text-[10px] font-medium text-gray-400 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                              {student.admissionNo}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-500">{student.className}</span>
                            {student.currentPolicyName && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                <span>• Currently has: {student.currentPolicyName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setAssignmentData(prev => ({
                              ...prev,
                              excludeIds: prev.excludeIds.includes(student.id)
                                ? prev.excludeIds.filter(id => id !== student.id)
                                : [...prev.excludeIds, student.id]
                            }));
                          }}
                          className={clsx(
                            "px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border",
                            assignmentData.excludeIds.includes(student.id)
                              ? "bg-blue-50 text-primary-600 border-blue-100 hover:bg-white"
                              : "bg-white text-red-500 border-gray-100 hover:bg-red-50 hover:border-red-100"
                          )}
                        >
                          {assignmentData.excludeIds.includes(student.id) ? 'Include Student' : 'Exclude Student'}
                        </button>
                      </div>
                    ))}
                  </div>
                  {simulationResult.conflicts > 0 && (
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex gap-3">
                      <Info className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-primary-700 dark:text-blue-300 leading-relaxed font-medium">
                        Students with existing policies will have their current policy <span className="font-bold text-blue-800 dark:text-blue-100 underline decoration-blue-500/30">replaced</span> by this new one unless they are excluded.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {simulationResult && simulationResult.students.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-white uppercase text-[10px] tracking-widest bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-100 dark:border-gray-800/50 shadow-sm mr-1">Summary</span>
                      <span>This will apply to </span>
                      <span className="text-primary-600 font-bold">{simulationResult.total - assignmentData.excludeIds.length}</span>
                      <span> students</span>
                      {assignmentData.classIds.length > 0 && <span className="text-gray-400 italic font-normal"> (across {assignmentData.classIds.length} classes)</span>}
                      {simulationResult.conflicts > 0 && (
                        <span className="text-amber-600 flex items-center gap-1 font-bold italic ml-1">
                          • {simulationResult.conflicts} replacements detected
                        </span>
                      )}
                    </div>
                  ) : isSimulating ? (
                    <div className="flex items-center gap-2 text-primary-600 animate-pulse font-bold uppercase tracking-widest text-[11px]">
                      <Clock className="w-4 h-4" />
                      Finalizing allocation summary...
                    </div>
                  ) : (
                    "Select targets to see a summary."
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-8 py-3 text-gray-500 dark:text-gray-400 font-bold hover:bg-white dark:hover:bg-gray-800 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAssignment}
                  disabled={(assignmentData.classIds.length === 0 && assignmentData.sectionIds.length === 0 && assignmentData.categoryIds.length === 0 && assignmentData.studentIds.length === 0) || isSimulating}
                  className="flex items-center gap-2 px-10 py-3 bg-primary-600 text-white rounded-2xl font-bold shadow-xl shadow-primary-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all cursor-pointer"
                >
                  <Save className="w-5 h-5" />
                  Apply Policy to {simulationResult ? (simulationResult.total - assignmentData.excludeIds.length) : 'Targets'} Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
