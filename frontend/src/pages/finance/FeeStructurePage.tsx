import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Layers,
  Tag,
  LayoutGrid
} from 'lucide-react';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { clsx } from 'clsx';

interface FeeHead {
  id: string;
  name: string;
  description: string;
  defaultAmount: string;
  isActive: boolean;
  isOptional: boolean;
}

interface FeeGroup {
  id: string;
  name: string;
  description: string;
  heads: FeeHead[];
}


export default function FeeStructurePage() {
  const { showError, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<'heads' | 'groups'>('heads');
  const [loading, setLoading] = useState(false);


  // Data State
  const [heads, setHeads] = useState<FeeHead[]>([]);
  const [groups, setGroups] = useState<FeeGroup[]>([]);

  // Search/Filter State
  const [headSearch, setHeadSearch] = useState('');

  const filteredHeads = heads.filter(h =>
    h.name.toLowerCase().includes(headSearch.toLowerCase()) ||
    (h.description?.toLowerCase() || '').includes(headSearch.toLowerCase())
  );

  // Form State
  const [isHeadModalOpen, setIsHeadModalOpen] = useState(false);
  const [editingHead, setEditingHead] = useState<FeeHead | null>(null);
  const [newHead, setNewHead] = useState({
    name: '',
    description: '',
    defaultAmount: '',
    isOptional: false
  });

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FeeGroup | null>(null);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', headIds: [] as string[] });


  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'heads') {
        const res = await api.getFeeHeads();
        setHeads(res || []);
      } else if (activeTab === 'groups') {
        const res = await api.getFeeGroups();
        setGroups(res || []);
        const hRes = await api.getFeeHeads();
        setHeads(hRes || []);
      }
    } catch (error) {
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHead = async (id: string) => {
    if (!window.confirm('Are you sure? This may affect groups using this head.')) return;
    try {
      await api.deleteFeeHead(id);
      showSuccess('Fee Head deleted');
      fetchData();
    } catch (e) {
      showError('Failed to delete head');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;
    try {
      await api.deleteFeeGroup(id);
      showSuccess('Fee Group deleted');
      fetchData();
    } catch (e) {
      showError('Failed to delete group');
    }
  };

  const handleCreateHead = async () => {
    if (!newHead.name) return showError('Name is required');
    try {
      if (editingHead) {
        await api.updateFeeHead(editingHead.id, newHead);
        showSuccess('Fee Head updated');
      } else {
        await api.createFeeHead(newHead);
        showSuccess('Fee Head created');
      }
      setIsHeadModalOpen(false);
      setEditingHead(null);
      setNewHead({ name: '', description: '', defaultAmount: '', isOptional: false });
      fetchData();
    } catch (error) {
      showError('Operation failed');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name || newGroup.headIds.length === 0) return showError('Name and at least one head required');
    try {
      if (editingGroup) {
        await api.updateFeeGroup(editingGroup.id, newGroup);
        showSuccess('Fee Group updated');
      } else {
        await api.createFeeGroup(newGroup);
        showSuccess('Fee Group created');
      }
      setIsGroupModalOpen(false);
      setEditingGroup(null);
      setNewGroup({ name: '', description: '', headIds: [] });
      fetchData();
    } catch (error) {
      showError('Operation failed');
    }
  };


  const openEditHead = (head: FeeHead) => {
    setEditingHead(head);
    setNewHead({
      name: head.name,
      description: head.description || '',
      defaultAmount: head.defaultAmount,
      isOptional: head.isOptional
    });
    setIsHeadModalOpen(true);
  };

  const openEditGroup = (group: FeeGroup) => {
    setEditingGroup(group);
    setNewGroup({
      name: group.name,
      description: group.description || '',
      headIds: group.heads.map(h => h.id)
    });
    setIsGroupModalOpen(true);
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Structure</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Define and manage fee components and groups.</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('heads')}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'heads' ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Tag size={16} className="inline mr-2" />
            Fee Heads
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'groups' ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Layers size={16} className="inline mr-2" />
            Fee Groups
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'heads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search Heads..."
                value={headSearch}
                onChange={e => setHeadSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
              />
            </div>
            <button
              onClick={() => {
                setEditingHead(null);
                setNewHead({ name: '', description: '', defaultAmount: '', isOptional: false });
                setIsHeadModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            >
              <Plus size={18} />
              New Fee Head
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl border border-gray-100 dark:border-gray-700" />
              ))
            ) : filteredHeads.map(head => (
              <div key={head.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                      <Tag size={20} />
                    </div>
                    {head.isOptional ? (
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded uppercase tracking-tighter border border-amber-100 dark:border-amber-900/30">Optional</span>
                    ) : (
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded uppercase tracking-tighter border border-indigo-100 dark:border-indigo-900/30">Mandatory</span>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditHead(head)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-600"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteHead(head.id)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{head.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{head.description || 'No description provided.'}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-700">
                  <span className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(head.defaultAmount)}</span>
                  <span className={clsx(
                    "text-[10px] font-bold px-2 py-1 rounded-md",
                    head.isActive ? "bg-green-50 text-green-600 dark:bg-green-900/20" : "bg-red-50 text-red-600 dark:bg-red-900/20"
                  )}>
                    {head.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fee Groups</h2>
            <button
              onClick={() => {
                setEditingGroup(null);
                setNewGroup({ name: '', description: '', headIds: [] });
                setIsGroupModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            >
              <Plus size={18} />
              Create Fee Group
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groups.map(group => (
              <div key={group.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/10 flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white">{group.name}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{group.heads.length} COMPONENTS</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">TOTAL VALUE</p>
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {formatCurrency(group.heads.reduce((acc, h) => acc + parseFloat(h.defaultAmount), 0))}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {group.heads.map(h => (
                      <span key={h.id} className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <Tag size={12} className={clsx(h.isOptional ? "text-amber-500" : "text-blue-500")} />
                        {h.name}
                        <span className="text-gray-400 ml-1 opacity-50">({formatCurrency(h.defaultAmount)})</span>
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => openEditGroup(group)}
                      className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                    >
                      Edit Components
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                      Delete Group
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {groups.length === 0 && !loading && (
              <div className="lg:col-span-2 py-20 bg-gray-50/50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400">
                <LayoutGrid size={48} className="mb-4 opacity-20" />
                <p className="font-bold">No Fee Groups Created Yet</p>
                <button onClick={() => setIsGroupModalOpen(true)} className="mt-4 text-blue-600 text-sm font-bold">Build your first group →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {isHeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 text-left">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Tag className="text-blue-600" />
              {editingHead ? 'Edit Fee Head' : 'New Fee Head'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 font-bold"
                  placeholder="e.g. Tuition Fee"
                  value={newHead.name}
                  onChange={e => setNewHead({ ...newHead, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewHead({ ...newHead, isOptional: false })}
                  className={clsx(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1",
                    !newHead.isOptional
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 shadow-sm"
                      : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400"
                  )}
                >
                  <span className="text-xs font-bold">Mandatory</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewHead({ ...newHead, isOptional: true })}
                  className={clsx(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1",
                    newHead.isOptional
                      ? "border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-600 shadow-sm"
                      : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400"
                  )}
                >
                  <span className="text-xs font-bold">Optional</span>
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Default Amount ({CURRENCY_SYMBOL})</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  value={newHead.defaultAmount}
                  onChange={e => setNewHead({ ...newHead, defaultAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="What is this fee for?"
                  value={newHead.description}
                  onChange={e => setNewHead({ ...newHead, description: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setIsHeadModalOpen(false);
                    setEditingHead(null);
                  }}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateHead}
                  className="flex-1 py-3 text-sm font-bold bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                >
                  {editingHead ? 'Update Head' : 'Create Head'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 text-left">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Layers className="text-blue-600" />
              {editingGroup ? 'Edit Fee Group' : 'Create Fee Group'}
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Group Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. JSS1 Term 1 Fees"
                  value={newGroup.name}
                  onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Select Components</label>
                <div className="mt-2 grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2">
                  {heads.map(h => (
                    <button
                      key={h.id}
                      onClick={() => {
                        const ids = newGroup.headIds.includes(h.id)
                          ? newGroup.headIds.filter(id => id !== h.id)
                          : [...newGroup.headIds, h.id];
                        setNewGroup({ ...newGroup, headIds: ids });
                      }}
                      className={clsx(
                        "flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                        newGroup.headIds.includes(h.id)
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 shadow-sm"
                          : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500"
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold truncate max-w-[100px]">{h.name}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                          {h.isOptional ? 'Optional' : 'Mandatory'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black">{formatCurrency(h.defaultAmount)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setIsGroupModalOpen(false);
                    setEditingGroup(null);
                  }}
                  className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  className="flex-1 py-4 text-sm font-bold bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                >
                  {editingGroup ? 'Update Group' : 'Build Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
