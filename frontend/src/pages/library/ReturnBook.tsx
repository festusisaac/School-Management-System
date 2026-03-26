import React, { useState } from 'react';
import { libraryService } from '../../services/library.service';
import { useToast } from '../../context/ToastContext';
import { Search, RotateCcw, Calendar, Banknote, User, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReturnBook: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [accessionNumber, setAccessionNumber] = useState('');
  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [returning, setReturning] = useState(false);

  const handleSearchLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessionNumber) return;
    
    setLoading(true);
    setLoan(null);
    try {
      const data = await libraryService.findActiveLoanByBarcode(accessionNumber);
      if (data) {
        setLoan(data);
      } else {
        showError('No active loan found for this accession number');
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to search loan');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!loan) return;
    setReturning(true);
    try {
      await libraryService.returnBook(loan.id);
      showSuccess('Book returned successfully');
      navigate('/library/dashboard');
    } catch (err) {
      showError('Failed to return book');
    } finally {
      setReturning(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Quick Return</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter accession number to process return.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <form onSubmit={handleSearchLoan} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              autoFocus
              type="text"
              placeholder="Accession / Copy Number..."
              value={accessionNumber}
              onChange={(e) => setAccessionNumber(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-transparent border-none focus:ring-0 outline-none font-bold"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all flex items-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RotateCcw size={18} />}
            <span>Find</span>
          </button>
        </form>
      </div>

      {loan && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm divide-y divide-gray-50 dark:divide-gray-700 animate-in slide-in-from-bottom duration-300">
          <div className="p-6 flex flex-col sm:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-primary-600 border border-gray-100 dark:border-gray-700">
                    <BookOpen size={20} />
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{loan.copy?.book?.title}</h3>
                    <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest mt-0.5">Barcode: {loan.copy?.barcode}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div className="flex items-center gap-2">
                    <User className="text-gray-400" size={14} />
                    <div>
                       <p className="text-[10px] text-gray-400 font-bold uppercase">Borrower ID</p>
                       <p className="text-xs font-bold text-gray-700 dark:text-gray-300 line-clamp-1">{loan.borrowerId || 'N/A'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <Calendar className="text-red-400" size={14} />
                    <div>
                       <p className="text-[10px] text-red-500 font-bold uppercase">Due Date</p>
                       <p className="text-xs font-bold text-red-600">{new Date(loan.dueAt).toLocaleDateString()}</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="w-full sm:w-48 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 flex flex-col justify-center items-center text-center">
               <p className="text-[10px] text-gray-400 font-bold uppercase">Estimated Fine</p>
               <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                 {loan.fineAmount > 0 ? `₦${loan.fineAmount}` : 'None'}
               </p>
            </div>
          </div>

          <div className="p-4 bg-gray-50/50 dark:bg-gray-900/30 flex justify-end">
            <button
              onClick={handleReturn}
              disabled={returning}
              className="px-8 py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
            >
              {returning ? 'Processing...' : 'Confirm Return'}
            </button>
          </div>
        </div>
      )}

      {!loan && !loading && (
        <div className="py-20 text-center opacity-30">
           <p className="text-xs font-bold uppercase tracking-[0.2em]">Ready for input</p>
        </div>
      )}
    </div>
  );
};

export default ReturnBook;
