import React, { useState, useEffect } from 'react';
import { libraryService, Book } from '../../services/library.service';
import { useToast } from '../../context/ToastContext';
import { Search, Book as BookIcon, User, Calendar, AlertCircle } from 'lucide-react';
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
  const [selectedBorrower, setSelectedBorrower] = useState<any>(null);
  
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Search books
  useEffect(() => {
    if (keyword.length > 2) {
      libraryService.getBooks({ keyword }).then(setBooks);
    } else {
      setBooks([]);
    }
  }, [keyword]);

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setSelectedCopy('');
    setKeyword('');
    setBooks([]);
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCopy || !selectedBorrower || !dueDate) {
      showError('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await libraryService.issueBook({
        copyId: selectedCopy,
        studentId: borrowerType === 'student' ? selectedBorrower.id : undefined,
        staffId: borrowerType === 'staff' ? selectedBorrower.id : undefined,
        dueDate
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
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Check out a book copy to a borrower.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Select Book */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">1. Select Book & Copy</h2>

          {!selectedBook ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search title or ISBN..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
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
                        <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{book.authors?.map(a => a.name).join(', ')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl flex justify-between items-center group">
                 <div className="flex items-center gap-3">
                    <BookIcon className="text-primary-600 shrink-0" size={18} />
                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{selectedBook.title}</span>
                 </div>
                 <button onClick={() => setSelectedBook(null)} className="text-[10px] font-black text-primary-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Change</button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {selectedBook.copies?.filter(c => c.status === 'Available').map(copy => (
                  <button
                    key={copy.id}
                    onClick={() => setSelectedCopy(copy.id)}
                    className={`p-2.5 rounded-lg border text-xs font-black transition-all ${
                      selectedCopy === copy.id 
                        ? 'border-primary-600 bg-primary-50 text-primary-700' 
                        : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-400'
                    }`}
                  >
                    ACC: {copy.copyNumber}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Select Borrower */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">2. Borrower & Due Date</h2>

          <div className="flex p-1 bg-gray-50 dark:bg-gray-900 rounded-lg">
             <button
               onClick={() => { setBorrowerType('student'); setSelectedBorrower(null); }}
               className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${borrowerType === 'student' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-400'}`}
             >Student</button>
             <button
               onClick={() => { setBorrowerType('staff'); setSelectedBorrower(null); }}
               className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${borrowerType === 'staff' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-400'}`}
             >Staff</button>
          </div>

          {!selectedBorrower ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={`Search ${borrowerType}...`}
                value={borrowerKeyword}
                onChange={(e) => setBorrowerKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 outline-none text-sm"
              />
              {borrowerKeyword.length > 2 && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 text-center">
                   <p className="text-[10px] text-gray-400 mb-2 italic">Select student from directory</p>
                   <button 
                     onClick={() => setSelectedBorrower({ id: 'demo-id', name: 'Sample User' })}
                     className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold"
                   >Select "Sample User"</button>
                </div>
              )}
            </div>
          ) : (
             <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <User className="text-gray-400 shrink-0" size={18} />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Sample User</span>
                 </div>
                 <button onClick={() => setSelectedBorrower(null)} className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Change</button>
              </div>
          )}

          <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date</label>
             <div className="relative">
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input
                 type="date"
                 required
                 value={dueDate}
                 onChange={(e) => setDueDate(e.target.value)}
                 className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 outline-none text-sm"
               />
             </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
         <button
           onClick={handleIssue}
           disabled={loading || !selectedCopy || !dueDate}
           className="px-12 py-3.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:opacity-90 transition-all shadow-xl disabled:opacity-30 active:scale-95"
         >
           {loading ? 'Processing...' : 'Confirm Issue'}
         </button>
      </div>
    </div>
  );
};

export default IssueBook;
