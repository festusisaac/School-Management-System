import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { libraryService, Book } from '../../services/library.service';
import { getFileUrl } from '../../services/api';
import { 
  ArrowLeft, 
  Trash, 
  Plus, 
  Book as BookIcon, 
  Hash, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Edit,
  User as UserIcon
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/ui/modal';

const BookDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();
  
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyBarcode, setCopyBarcode] = useState('');
  const [copyLocation, setCopyLocation] = useState('');
  const [savingCopy, setSavingCopy] = useState(false);

  const fetchBook = () => {
    if (!id) return;
    setLoading(true);
    libraryService.getBook(id)
      .then(setBook)
      .catch(() => showError('Failed to load book'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBook();
  }, [id]);

  const handleAddCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingCopy(true);
    try {
      await libraryService.createCopy(id, { barcode: copyBarcode, location: copyLocation });
      showSuccess('Copy added');
      setCopyBarcode('');
      setCopyLocation('');
      setIsCopyModalOpen(false);
      fetchBook();
    } catch (err) {
      showError('Failed to add copy');
    } finally {
      setSavingCopy(false);
    }
  };

  const handleDeleteCopy = async (copyId: string) => {
    if (!window.confirm('Delete this copy?')) return;
    try {
      await libraryService.deleteCopy(copyId);
      showSuccess('Copy deleted');
      fetchBook();
    } catch (err) {
      showError('Failed to delete copy');
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-xs font-bold uppercase tracking-widest text-gray-400">Loading catalog...</div>;
  if (!book) return <div className="p-20 text-center text-sm font-bold text-gray-500">Book not found.</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Link to="/library" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary-600 transition-colors">
          <ArrowLeft size={14} />
          Back
        </Link>
        <Link to={`/library/edit/${book.id}`} className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors">
          <Edit size={14} />
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Cover & Essential Info */}
        <div className="space-y-6">
          <div className="aspect-[3/4] bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
            {book.coverPath ? (
              <img src={getFileUrl(book.coverPath)} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-200">
                <BookIcon size={48} strokeWidth={1} />
              </div>
            )}
          </div>

          <div className="space-y-4 px-1">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">ISBN</p>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">{book.isbn || '---'}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">Publisher</p>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">{book.publisher || '---'}</p>
               </div>
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">Authors</p>
               <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">{book.authors?.map(a => a.name).join(', ') || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Right: Detailed Content */}
        <div className="lg:col-span-3 space-y-8">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {book.categories?.map(c => (
                <span key={c.id} className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-md">
                  {c.name}
                </span>
              ))}
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{book.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">{book.description || 'No description available for this title.'}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 pb-3">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 Inventory <span className="w-5 h-5 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center text-[10px] normal-case tracking-normal">{book.copies?.length || 0}</span>
              </h2>
              <button
                onClick={() => setIsCopyModalOpen(true)}
                className="flex items-center px-4 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-all"
              >
                <Plus size={12} className="mr-1.5" />
                Add Copy
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {book.copies?.map((copy) => (
                <div key={copy.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 group hover:border-primary-500/20 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-gray-300 uppercase leading-none">Accession</p>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-1">{copy.barcode || 'N/A'}</h4>
                    </div>
                    <div className={copy.status === 'available' ? 'text-green-500' : 'text-amber-500'}>
                      {copy.status === 'available' ? <CheckCircle2 size={16} strokeWidth={2.5} /> : <Clock size={16} strokeWidth={2.5} />}
                    </div>
                  </div>
                                   <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-900 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${copy.status?.toLowerCase() === 'available' ? 'text-green-600' : 'text-amber-500'}`}>
                        {copy.status}
                      </span>
                      <button 
                        onClick={() => handleDeleteCopy(copy.id)}
                        className="p-1 px-2 text-[10px] font-black text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Delete
                      </button>
                    </div>
                    
                    {copy.status?.toLowerCase() === 'loaned' && (
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
                        <UserIcon size={12} className="text-amber-600" />
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 truncate">
                          {(() => {
                            const activeLoan = copy.loans?.find(l => l.status === 'active');
                            if (!activeLoan) return 'Unknown Borrower';
                            const b = activeLoan.student || activeLoan.staff;
                            return b ? `${b.firstName} ${b.lastName}` : 'System User';
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Loans History */}
          <div className="space-y-4 pt-4">
             <div className="border-b border-gray-50 dark:border-gray-800 pb-3">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   Recent Circulation History
                </h2>
             </div>
             <div className="bg-gray-50/50 dark:bg-gray-900/20 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-gray-100/50 dark:bg-gray-800/50">
                         <th className="px-4 py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Borrower</th>
                         <th className="px-4 py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Accession</th>
                         <th className="px-4 py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Issued</th>
                         <th className="px-4 py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {(() => {
                        const allLoans = book.copies?.flatMap(c => (c.loans || []).map(l => ({...l, barcode: c.barcode})))
                          .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
                          .slice(0, 5) || [];
                        
                        if (allLoans.length === 0) {
                           return (
                             <tr>
                                <td colSpan={4} className="px-4 py-10 text-center text-[10px] font-black uppercase text-gray-300 italic tracking-widest">No previous transaction record found</td>
                             </tr>
                           );
                        }

                        return allLoans.map((loan: any) => (
                           <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-4 py-3">
                                 <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-primary-500 border border-gray-100 dark:border-gray-700 shadow-sm">
                                       <UserIcon size={10} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                       {loan.student ? `${loan.student.firstName} ${loan.student.lastName}` : (loan.staff ? `${loan.staff.firstName} ${loan.staff.lastName}` : 'System User')}
                                    </p>
                                 </div>
                              </td>
                              <td className="px-4 py-3">
                                 <span className="text-[10px] font-black text-gray-500 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-700">{loan.barcode}</span>
                              </td>
                              <td className="px-4 py-3">
                                 <p className="text-[10px] font-bold text-gray-500">{new Date(loan.issuedAt).toLocaleDateString()}</p>
                              </td>
                              <td className="px-4 py-3">
                                 <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                                    loan.status === 'active' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                                 }`}>
                                    {loan.status}
                                 </span>
                              </td>
                           </tr>
                        ));
                      })()}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        title="Add Inventory Copy"
      >
        <form onSubmit={handleAddCopy} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Accession Number</label>
              <input
                required
                autoFocus
                value={copyBarcode}
                onChange={(e) => setCopyBarcode(e.target.value)}
                className="w-full px-4 py-2 text-sm rounded-xl border border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="e.g. ACC-001"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Shelf Location</label>
              <input
                value={copyLocation}
                onChange={(e) => setCopyLocation(e.target.value)}
                className="w-full px-4 py-2 text-sm rounded-xl border border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="e.g. Shelf A-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              disabled={savingCopy}
              type="submit"
              className="w-full py-3 bg-primary-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/20"
            >
              {savingCopy ? 'Saving...' : 'Confirm Add'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BookDetail;
