import React, { useEffect, useState } from 'react';
import { libraryService, Category } from '../../services/library.service';
import { useLibraryStore } from '../../stores/libraryStore';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, Book as BookIcon, Edit, Trash } from 'lucide-react';
import { getFileUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const BookList: React.FC = () => {
  const { books, fetchBooks, loading } = useLibraryStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchBooks();
    libraryService.getCategories().then(setCategories);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks({ keyword: search, categoryId: selectedCategory });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await libraryService.deleteBook(id);
      showSuccess('Book deleted');
      fetchBooks();
    } catch (err) {
      showError('Failed to delete book');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Books Catalog</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Browse and manage your library collection.</p>
        </div>
        <Link
          to="/library/add"
          className="flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus size={16} className="mr-2" />
          Add Book
        </Link>
      </div>

      {/* Filters & Search */}
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search title, ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-primary-500 focus:ring-0 outline-none transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-primary-500 outline-none transition-all text-sm font-medium"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-colors"
        >
          Filter
        </button>
      </form>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {loading ? (
          [...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
            </div>
          ))
        ) : (
          books.map((book) => (
            <div key={book.id} className="group flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
              <Link to={`/library/${book.id}`} className="block relative aspect-[3/4] overflow-hidden bg-gray-50 dark:bg-gray-900">
                {book.coverPath ? (
                  <img
                    src={getFileUrl(book.coverPath)}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                    <BookIcon size={32} strokeWidth={1} />
                    <span className="text-[10px] mt-2 uppercase tracking-widest font-black opacity-30">No Cover</span>
                  </div>
                )}
              </Link>
              
              <div className="p-3.5 flex-1 flex flex-col">
                <Link to={`/library/${book.id}`} className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 hover:text-primary-600 transition-colors">
                  {book.title}
                </Link>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 line-clamp-1">
                  {book.authors?.map(a => a.name).join(', ') || 'Unknown'}
                </p>
                
                <div className="mt-2">
                   <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter ${
                      book.copies?.some(c => c.status?.toLowerCase() === 'available') 
                         ? 'bg-green-50 text-green-600' 
                         : 'bg-red-50 text-red-600'
                   }`}>
                      {book.copies?.filter(c => c.status?.toLowerCase() === 'available').length || 0} / {book.copies?.length || 0} Avail
                   </span>
                </div>
                
                <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50 dark:border-gray-700 mt-3">
                  <span className="text-[9px] font-black uppercase text-gray-300 tracking-tighter">
                    {book.isbn || 'ISBN-N/A'}
                  </span>
                  <div className="flex gap-1">
                    <Link to={`/library/edit/${book.id}`} className="p-1 px-2 text-[10px] font-black uppercase text-gray-400 hover:text-primary-600 transition-colors">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(book.id)} className="p-1 px-2 text-[10px] font-black uppercase text-gray-400 hover:text-red-600 transition-colors">
                      Del
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {books.length === 0 && !loading && (
        <div className="py-20 text-center opacity-30">
          <BookIcon size={32} className="mx-auto mb-2" />
          <p className="text-xs font-black uppercase tracking-widest">No matching books</p>
        </div>
      )}
    </div>
  );
};

export default BookList;
