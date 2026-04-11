import { useState, useEffect } from 'react';
import { BookOpen, Clock, CheckCircle, AlertTriangle, BookMarked } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { libraryService } from '../../services/library.service';
import { useToast } from '../../context/ToastContext';
import { useSystem } from '../../context/SystemContext';

const StudentLibraryPage = () => {
    const { user, selectedChildId } = useAuthStore();
    const isParent = (user?.role || user?.roleObject?.name || '').toLowerCase() === 'parent';
    const { showError } = useToast();
    const { getFullUrl } = useSystem();
    const [loading, setLoading] = useState(true);
    const [loans, setLoans] = useState<any[]>([]);
    const [tab, setTab] = useState<'active' | 'returned'>('active');

    useEffect(() => {
        const fetchLoans = async () => {
            try {
                const targetId = isParent ? selectedChildId : (user?.studentId || user?.id || 'me');
                if (isParent && !targetId) {
                    setLoans([]);
                    setLoading(false);
                    return;
                }

                setLoading(true);
                const data = await libraryService.getStudentLoans(targetId);
                setLoans(data || []);
            } catch (error: any) {
                showError(error.response?.data?.message || 'Failed to load library data');
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchLoans();
    }, [user, isParent, selectedChildId]);

    const activeLoans = loans.filter(l => l.status === 'active');
    const returnedLoans = loans.filter(l => l.status === 'returned');
    const currentList = tab === 'active' ? activeLoans : returnedLoans;

    const totalFines = loans
        .filter(l => l.fineAmount > 0 && !l.finePaid)
        .reduce((sum, l) => sum + l.fineAmount, 0);

    const isOverdue = (loan: any) => {
        if (loan.status !== 'active') return false;
        return new Date(loan.dueAt) < new Date();
    };

    const daysUntilDue = (dueAt: string) => {
        const diff = new Date(dueAt).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Library</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your borrowed books, due dates, and return history.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeLoans.length}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Borrowed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{returnedLoans.length}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Returned</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeLoans.filter(isOverdue).length}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Overdue</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                            <BookMarked className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">₦{totalFines.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Fines</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                <button
                    onClick={() => setTab('active')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                        tab === 'active'
                            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                >
                    Currently Borrowed ({activeLoans.length})
                </button>
                <button
                    onClick={() => setTab('returned')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                        tab === 'returned'
                            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                >
                    Return History ({returnedLoans.length})
                </button>
            </div>

            {/* Book List */}
            {currentList.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {tab === 'active' ? 'No books currently borrowed' : 'No return history yet'}
                    </h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        {tab === 'active'
                            ? 'Visit the library to borrow books!'
                            : 'Books you return will show up here.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {currentList.map((loan) => {
                        const book = loan.copy?.book;
                        const overdue = isOverdue(loan);
                        const days = daysUntilDue(loan.dueAt);

                        return (
                            <div
                                key={loan.id}
                                className={`bg-white dark:bg-gray-900 rounded-xl border p-4 sm:p-5 transition-all ${
                                    overdue
                                        ? 'border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-900/10'
                                        : 'border-gray-100 dark:border-gray-800'
                                }`}
                            >
                                <div className="flex gap-4">
                                    {/* Book Cover */}
                                    <div className="w-16 h-20 sm:w-20 sm:h-28 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                                        {book?.coverPath ? (
                                            <img
                                                src={getFullUrl(book.coverPath)}
                                                alt={book.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <BookOpen className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                                            {book?.title || 'Unknown Book'}
                                        </h3>
                                        {book?.authors && book.authors.length > 0 && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                by {book.authors.map((a: any) => a.name).join(', ')}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                Issued: {formatDate(loan.issuedAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                Due: {formatDate(loan.dueAt)}
                                            </span>
                                            {loan.returnedAt && (
                                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Returned: {formatDate(loan.returnedAt)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Status badges */}
                                        <div className="flex gap-2 mt-3">
                                            {loan.status === 'active' && !overdue && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                    <Clock className="w-3 h-3" />
                                                    {days} day{days !== 1 ? 's' : ''} left
                                                </span>
                                            )}
                                            {overdue && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Overdue by {Math.abs(days)} day{Math.abs(days) !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {loan.status === 'returned' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Returned
                                                </span>
                                            )}
                                            {loan.fineAmount > 0 && (
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                                                    loan.finePaid
                                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                                        : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                }`}>
                                                    ₦{loan.fineAmount.toLocaleString()} {loan.finePaid ? '(Paid)' : 'Fine'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StudentLibraryPage;
