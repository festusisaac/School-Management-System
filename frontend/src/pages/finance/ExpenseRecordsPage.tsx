import { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Receipt, Search, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';

interface ExpenseCategory {
  id: string;
  name: string;
}

interface ExpenseVendor {
  id: string;
  name: string;
}

interface SchoolSection {
  id: string;
  name: string;
}

interface ExpenseRecord {
  id: string;
  title: string;
  amount: string;
  expenseDate: string;
  status: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  description?: string;
  categoryId: string;
  vendorId?: string;
  schoolSectionId?: string;
  category?: { name: string };
  vendor?: { name: string };
  schoolSection?: { name: string };
}

const initialForm = {
  title: '',
  amount: '',
  expenseDate: new Date().toISOString().split('T')[0],
  categoryId: '',
  vendorId: '',
  schoolSectionId: '',
  status: 'PENDING',
  paymentMethod: 'BANK_TRANSFER',
  referenceNumber: '',
  description: '',
  notes: '',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

export default function ExpenseRecordsPage() {
  const { showError, showSuccess } = useToast();
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [vendors, setVendors] = useState<ExpenseVendor[]>([]);
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ExpenseRecord | null>(null);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState({ search: '', status: '', categoryId: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [recordResponse, categoryResponse, vendorResponse, sectionResponse] = await Promise.all([
        api.getExpenses({ limit: 100, ...filters, status: filters.status || undefined, categoryId: filters.categoryId || undefined, search: filters.search || undefined }),
        api.getExpenseCategories(),
        api.getExpenseVendors(),
        api.getSchoolSections(),
      ]);

      setRecords(recordResponse?.items || []);
      setCategories(categoryResponse || []);
      setVendors(vendorResponse || []);
      setSections(sectionResponse || []);
    } catch (error) {
      console.error(error);
      showError('Failed to load expense records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.search, filters.status, filters.categoryId]);

  const categoryOptions = useMemo(() => categories.filter((item: any) => item.isActive !== false), [categories]);
  const vendorOptions = useMemo(() => vendors.filter((item: any) => item.isActive !== false), [vendors]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (record: ExpenseRecord) => {
    setEditing(record);
    setForm({
      title: record.title,
      amount: record.amount,
      expenseDate: record.expenseDate,
      categoryId: record.categoryId,
      vendorId: record.vendorId || '',
      schoolSectionId: record.schoolSectionId || '',
      status: record.status,
      paymentMethod: record.paymentMethod || 'BANK_TRANSFER',
      referenceNumber: record.referenceNumber || '',
      description: record.description || '',
      notes: record.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      ...form,
      vendorId: form.vendorId || undefined,
      schoolSectionId: form.schoolSectionId || undefined,
      referenceNumber: form.referenceNumber || undefined,
      description: form.description || undefined,
      notes: form.notes || undefined,
    };

    try {
      if (editing) {
        await api.updateExpense(editing.id, payload);
        showSuccess('Expense updated');
      } else {
        await api.createExpense(payload);
        showSuccess('Expense recorded');
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to save expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Archive this expense record?')) return;
    try {
      await api.deleteExpense(id);
      showSuccess('Expense archived');
      loadData();
    } catch (error) {
      showError('Failed to archive expense');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expense Records</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Capture operational spending, approvals, and vendor-linked payments.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-bold text-white hover:bg-primary-700">
          <Plus size={18} />
          Record Expense
        </button>
      </div>

      <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Search expenses..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            value={filters.categoryId}
            onChange={(event) => setFilters((prev) => ({ ...prev, categoryId: event.target.value }))}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Categories</option>
            {categoryOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr className="text-left text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">
                <th className="px-5 py-4">Expense</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Vendor</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">Loading expense records...</td></tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    <Receipt className="mx-auto mb-3 text-gray-300" size={36} />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No expense records found.</p>
                  </td>
                </tr>
              ) : records.map((record) => (
                <tr key={record.id} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900 dark:text-white">{record.title}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{record.referenceNumber || record.description || 'No reference provided'}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{record.category?.name || '-'}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{record.vendor?.name || '-'}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{new Date(record.expenseDate).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-sm font-black text-gray-900 dark:text-white">{formatCurrency(record.amount)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColors[record.status] || statusColors.DRAFT}`}>{record.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(record)} className="rounded-xl p-2 text-gray-500 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(record.id)} className="rounded-xl p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="w-full max-w-3xl rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editing ? 'Edit Expense' : 'Record Expense'}</h2>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Expense title" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required type="number" min="0" step="0.01" placeholder="Amount" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <input value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} required type="date" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="">Select category</option>
                {categoryOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="">Select vendor (optional)</option>
                {vendorOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={form.schoolSectionId} onChange={(e) => setForm({ ...form, schoolSectionId: e.target.value })} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="">School section (optional)</option>
                {sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="POS">POS</option>
                <option value="CHEQUE">Cheque</option>
                <option value="ONLINE">Online</option>
              </select>
              <input value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} placeholder="Reference number" className="md:col-span-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="md:col-span-2 min-h-[90px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes" className="md:col-span-2 min-h-[90px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-2xl px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
              <button type="submit" className="rounded-2xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700">{editing ? 'Update Expense' : 'Save Expense'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
