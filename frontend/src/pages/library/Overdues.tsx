import React, { useEffect, useState } from 'react';
import { libraryService } from '../../services/library.service';
import { DataTable } from '../../components/ui/data-table';
import { useToast } from '../../context/ToastContext';
import { ColumnDef } from '@tanstack/react-table';
import { Clock, CheckCircle, Banknote, User, Book as BookIcon } from 'lucide-react';

const Overdues: React.FC = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  const fetchOverdues = async () => {
    setLoading(true);
    try {
      const data = await libraryService.getOverdueLoans();
      setLoans(data);
    } catch (err) {
      showError('Failed to fetch overdue loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdues();
  }, []);

  const handleReturn = async (loanId: string) => {
    if (!window.confirm('Mark as returned?')) return;
    try {
      await libraryService.returnBook(loanId);
      showSuccess('Book returned');
      fetchOverdues();
    } catch (err) {
      showError('Failed to return');
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'book',
      header: 'Book / Copy',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <BookIcon size={14} className="text-gray-300" />
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{row.original.copy?.book?.title}</p>
            <p className="text-[10px] font-bold text-primary-600 uppercase">Acc: {row.original.copy?.copyNumber}</p>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'borrower',
      header: 'Borrower',
      cell: ({ row }) => {
        const borrower = row.original.student || row.original.staff;
        return (
          <div className="flex items-center gap-2">
            <User size={12} className="text-gray-300" />
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{borrower ? `${borrower.firstName} ${borrower.lastName}` : 'N/A'}</p>
          </div>
        );
      }
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const dueDate = new Date(row.original.dueDate);
        const isOverdue = dueDate < new Date();
        return (
          <div className="flex flex-col">
             <span className={`text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>{dueDate.toLocaleDateString()}</span>
             {isOverdue && <span className="text-[8px] font-black text-red-600 uppercase">Overdue</span>}
          </div>
        );
      }
    },
    {
      accessorKey: 'fineAmount',
      header: 'Fine',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-amber-600 font-bold text-xs font-mono">
           <Banknote size={12} />
           <span>₦{row.original.fineAmount || 0}</span>
        </div>
      )
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => handleReturn(row.original.id)}
          className="px-3 py-1 bg-gray-50 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-lg text-[10px] font-black uppercase transition-all"
        >
          Return
        </button>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
             Library Circulation
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage active loans and track overdue books.</p>
        </div>
        <div className="flex gap-4">
           <div className="text-right">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Total Overdue</p>
              <p className="text-xl font-black text-red-600 mt-0.5">{loans.filter(l => new Date(l.dueDate) < new Date()).length}</p>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <DataTable 
          columns={columns} 
          data={loans} 
          searchKey="book" 
          placeholder="Filter circulation..." 
          loading={loading}
        />
      </div>

      {loans.length === 0 && !loading && (
        <div className="py-20 text-center space-y-2 opacity-50">
           <CheckCircle className="mx-auto text-green-500" size={24} />
           <p className="text-xs font-bold uppercase tracking-widest text-gray-500">All cleared</p>
        </div>
      )}
    </div>
  );
};

export default Overdues;
