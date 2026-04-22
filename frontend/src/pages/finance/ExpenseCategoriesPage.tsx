import { useEffect, useState } from 'react';
import { Edit2, FolderTree, Plus, Search, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  code?: string;
  isActive: boolean;
}

const initialForm = { name: '', code: '', description: '', isActive: true };

export default function ExpenseCategoriesPage() {
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [form, setForm] = useState(initialForm);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await api.getExpenseCategories();
      setItems(response || []);
    } catch (error) {
      console.error(error);
      showError('Failed to load expense categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (item: ExpenseCategory) => {
    setEditing(item);
    setForm({
      name: item.name,
      code: item.code || '',
      description: item.description || '',
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editing) {
        await api.updateExpenseCategory(editing.id, form);
        showSuccess('Expense category updated');
      } else {
        await api.createExpenseCategory(form);
        showSuccess('Expense category created');
      }
      setShowModal(false);
      loadItems();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to save expense category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Archive this expense category?')) return;
    try {
      await api.deleteExpenseCategory(id);
      showSuccess('Expense category archived');
      loadItems();
    } catch (error) {
      showError('Failed to archive expense category');
    }
  };

  const filtered = items.filter((item) =>
    [item.name, item.code || '', item.description || ''].some((value) =>
      value.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expense Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Organize spending by department, purpose, or operational bucket.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-bold text-white hover:bg-primary-700">
          <Plus size={18} />
          New Category
        </button>
      </div>

      <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="border-b border-gray-100 dark:border-gray-800 p-4">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {loading ? (
            <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading categories...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <FolderTree className="mx-auto mb-3 text-gray-300" size={36} />
              <p className="text-sm text-gray-500 dark:text-gray-400">No expense categories found.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                      {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.description || 'No description provided.'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {item.code && <span className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{item.code}</span>}
                  <button onClick={() => openEdit(item)} className="rounded-xl p-2 text-gray-500 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="rounded-xl p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editing ? 'Edit Category' : 'New Category'}</h2>
            <div className="mt-5 space-y-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name" required className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Code (optional)" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="min-h-[100px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active category
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-2xl px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
              <button type="submit" className="rounded-2xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700">{editing ? 'Update Category' : 'Create Category'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
