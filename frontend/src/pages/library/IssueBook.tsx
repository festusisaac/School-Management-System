import React, { useState, useEffect } from 'react';
import { libraryService, Book } from '../../services/library.service';
import { useToast } from '../../context/ToastContext';
import { Search, Book as BookIcon, User as UserIcon, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const IssueBook: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [keyword, setKeyword] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedCopy, setSelectedCopy] = useState<string>('');
  
  const [borrowerType, setBorrowerType] = useState<'student' | 'staff'>('student');
  const [borrowerKeyword, setBorrowerKeyword] = useState('');
  const [borrowers, setBorrowers] = useState<any[]>([]);
  const [selectedBorrower, setSelectedBorrower] = useState<any>(null);
  
  const [dueAt, setDueAt] = useState('');
  const [loading, setLoading] = useState(false);

  // Search books
  useEffect(() => {
    if (keyword.length > 2) {
      libraryService.getBooks({ keyword }).then(setBooks);
    } else {
      setBooks([]);
    }
  }, [keyword]);

  // Search borrowers
  useEffect(() => {
    const timer = setTimeout(() => {
      if (borrowerKeyword.length > 2) {
        const searchMethod = borrowerType === 'student' ? libraryService.searchStudents : libraryService.searchStaff;
        searchMethod(borrowerKeyword).then(setBorrowers).catch(() => setBorrowers([]));
      } else {
        setBorrowers([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [borrowerKeyword, borrowerType]);

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setSelectedCopy('');
    setKeyword('');
    setBooks([]);

    // Auto-select first available copy if exists
    const available = book.copies?.filter(c => c.status?.toLowerCase() === 'available');
    if (available && available.length > 0) {
      setSelectedCopy(available[0].id);
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCopy || !selectedBorrower || !dueAt) {
      showError('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await libraryService.issueBook({
        copyId: selectedCopy,
        studentId: borrowerType === 'student' ? selectedBorrower.id : undefined,
        staffId: borrowerType === 'staff' ? selectedBorrower.id : undefined,
        dueAt
      });
      showSuccess('Book issued successfully');
      navigate('/library/overdues');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to issue book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Issue Book</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select a book and borrower to proceed.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Selection Card 1 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Book & Copy</label>
          
          {!selectedBook ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search title, ISBN..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-primary-500 outline-none text-sm"
              />
              {books.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto">
                  {books.map(book => (
                    <button
                      key={book.id}
                      onClick={() => handleSelectBook(book)}
                      className="w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left border-b border-gray-50 dark:border-gray-700 last:border-0"
                    >
                      <BookIcon className="text-gray-300 shrink-0" size={18} />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{book.title}</p>
                        <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{book.isbn}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                 <div className="flex items-center gap-3">
                    <BookIcon className="text-primary-600" size={18} />
                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{selectedBook.title}</span>
                 </div>
                 <button onClick={() => setSelectedBook(null)} className="text-[10px] font-black text-primary-600 uppercase">Change</button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(!selectedBook.copies || selectedBook.copies.filter(c => c.status?.toLowerCase() === 'available').length === 0) && (
                   <div className="col-span-2 text-center p-4 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl space-y-1">
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">No Available Copies</p>
                      <p className="text-[9px] text-gray-400 font-medium">
                        System found {selectedBook.copies?.length || 0} total units for this title.
                      </p>
                   </div>
                )}
                {selectedBook.copies?.filter(c => c.status?.toLowerCase() === 'available').map(copy => (
                  <button
                    key={copy.id}
                    onClick={() => setSelectedCopy(copy.id)}
                    className={`p-2.5 rounded-lg border text-xs font-black transition-all ${
                      selectedCopy === copy.id 
                        ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm' 
                        : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    ACC: {copy.barcode}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selection Card 2 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Borrower & Date</label>
             <div className="flex gap-2 bg-gray-50 dark:bg-gray-900 p-1 rounded-lg">
                <button onClick={() => {setBorrowerType('student'); setSelectedBorrower(null);}} className={`px-3 py-1 text-[9px] font-black uppercase rounded ${borrowerType === 'student' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-400'}`}>Student</button>
                <button onClick={() => {setBorrowerType('staff'); setSelectedBorrower(null);}} className={`px-3 py-1 text-[9px] font-black uppercase rounded ${borrowerType === 'staff' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-400'}`}>Staff</button>
             </div>
          </div>

          {!selectedBorrower ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={`Search ${borrowerType}...`}
                value={borrowerKeyword}
                onChange={(e) => setBorrowerKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-primary-500 outline-none text-sm"
              />
              {borrowers.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto">
                   {borrowers.map(borrower => (
                     <button
                       key={borrower.id}
                       onClick={() => setSelectedBorrower(borrower)}
                       className="w-full p-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left border-b border-gray-50 dark:border-gray-700 last:border-0"
                     >
                        <UserIcon size={14} className="text-gray-400" />
                        <div>
                           <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{borrower.firstName} {borrower.lastName}</p>
                           <p className="text-[9px] text-gray-400 uppercase mt-0.5">{borrower.admissionNumber || borrower.employeeId || borrower.id}</p>
                        </div>
                     </button>
                   ))}
                </div>
              )}
            </div>
          ) : (
             <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                 <div className="flex items-center gap-3">
                    <UserIcon className="text-primary-600" size={18} />
                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{selectedBorrower.firstName} {selectedBorrower.lastName}</span>
                 </div>
                 <button onClick={() => setSelectedBorrower(null)} className="text-[10px] font-black text-primary-600 uppercase">Change</button>
              </div>
          )}

          <div className="relative pt-2">
            <Calendar className="absolute left-3 top-[calc(50%+4px)] -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="date"
              required
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-primary-500 outline-none text-sm font-bold"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-10">
         <button
           onClick={handleIssue}
           disabled={loading || !selectedCopy || !selectedBorrower || !dueAt}
           className="px-12 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-xl disabled:opacity-30"
         >
           {loading ? 'Processing...' : 'Confirm Issue'}
         </button>
      </div>
    </div>
  );
};

export default IssueBook;
