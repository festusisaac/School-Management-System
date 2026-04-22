import { useEffect, useState } from 'react';
import { Building2, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ExpenseVendor {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
}

const initialForm = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
  isActive: true,
};

export default function ExpenseVendorsPage() {
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<ExpenseVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ExpenseVendor | null>(null);
  const [form, setForm] = useState(initialForm);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await api.getExpenseVendors();
      setItems(response || []);
    } catch (error) {
      showError('Failed to load vendors');
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

  const openEdit = (item: ExpenseVendor) => {
    setEditing(item);
    setForm({
      name: item.name,
      contactPerson: item.contactPerson || '',
      email: item.email || '',
      phone: item.phone || '',
      address: item.address || '',
      notes: item.notes || '',
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editing) {
        await api.updateExpenseVendor(editing.id, form);
        showSuccess('Vendor updated');
      } else {
        await api.createExpenseVendor(form);
        showSuccess('Vendor created');
      }
      setShowModal(false);
      loadItems();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to save vendor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Archive this vendor?')) return;
    try {
      await api.deleteExpenseVendor(id);
      showSuccess('Vendor archived');
      loadItems();
    } catch (error) {
      showError('Failed to archive vendor');
    }
  };

  const filtered = items.filter((item) =>
    [item.name, item.contactPerson || '', item.email || '', item.phone || ''].some((value) =>
      value.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expense Vendors</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Maintain payees, suppliers, and service providers for expense records.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-bold text-white hover:bg-primary-700">
          <Plus size={18} />
          New Vendor
        </button>
      </div>

      <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="border-b border-gray-100 dark:border-gray-800 p-4">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search vendors..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {loading ? (
            <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading vendors...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Building2 className="mx-auto mb-3 text-gray-300" size={36} />
              <p className="text-sm text-gray-500 dark:text-gray-400">No vendors found.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                      {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {[item.contactPerson, item.email, item.phone].filter(Boolean).join(' • ') || 'No contact details'}
                  </p>
                  {item.address && <p className="mt-1 text-xs text-gray-400">{item.address}</p>}
                </div>
                <div className="flex items-center gap-3">
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
          <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editing ? 'Edit Vendor' : 'New Vendor'}</h2>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Vendor name" required className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Contact person" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="md:col-span-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="md:col-span-2 min-h-[100px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <label className="md:col-span-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active vendor
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-2xl px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
              <button type="submit" className="rounded-2xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700">{editing ? 'Update Vendor' : 'Create Vendor'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
