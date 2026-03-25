import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { libraryService, Author, Category, Book } from '../../services/library.service';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Save, Upload, Book as BookIcon, X } from 'lucide-react';
import { getFileUrl } from '../../services/api';

const BookAddEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [formData, setFormData] = useState({
    title: '',
    isbn: '',
    publisher: '',
    publishedDate: '',
    description: '',
    authorIds: [] as string[],
    categoryIds: [] as string[],
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    libraryService.getAuthors().then(setAuthors);
    libraryService.getCategories().then(setCategories);

    if (id) {
      libraryService.getBook(id).then(book => {
        setFormData({
          title: book.title,
          isbn: book.isbn || '',
          publisher: book.publisher || '',
          publishedDate: book.publishedDate ? new Date(book.publishedDate).toISOString().split('T')[0] : '',
          description: book.description || '',
          authorIds: book.authors?.map(a => a.id) || [],
          categoryIds: book.categories?.map(c => c.id) || [],
        });
        if (book.coverPath) {
          setCoverPreview(getFileUrl(book.coverPath));
        }
        setFetching(false);
      }).catch(() => {
        showError('Book not found');
        navigate('/library');
      });
    }
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const toggleSelection = (listName: 'authorIds' | 'categoryIds', id: string) => {
    setFormData(prev => {
      const currentListValue = prev[listName] as string[];
      const newList = currentListValue.includes(id)
        ? currentListValue.filter(item => item !== id)
        : [...currentListValue, id];
      return { ...prev, [listName]: newList };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => fd.append(`${key}[]`, v));
      } else {
        fd.append(key, value);
      }
    });
    if (coverFile) {
      fd.append('cover', coverFile);
    }

    try {
      if (id) {
        await libraryService.updateBook(id, fd);
        showSuccess('Book updated successfully');
      } else {
        await libraryService.createBook(fd);
        showSuccess('Book added successfully');
      }
      navigate('/library');
    } catch (err) {
      showError('Failed to save book');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-20 text-center animate-pulse">Loading book data...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link to="/library" className="p-2 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
            {id ? 'Edit Book' : 'Add New Book'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Fill in the details to {id ? 'update' : 'add'} the book in the catalog.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Cover Upload */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">Book Cover</h3>
            <div className="relative group mx-auto w-48 aspect-[3/4] bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center">
              {coverPreview ? (
                <>
                  <img src={coverPreview} className="w-full h-full object-cover" alt="Preview" />
                  <button 
                    type="button"
                    onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <Upload size={32} strokeWidth={1} />
                  <span className="text-[10px] mt-2 font-medium">JPG/PNG, max 2MB</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
            </div>
          </div>
        </div>

        {/* Right: Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
             <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Book Title *</label>
                    <input
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">ISBN</label>
                    <input
                      value={formData.isbn}
                      onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Publisher</label>
                    <input
                      value={formData.publisher}
                      onChange={e => setFormData({ ...formData, publisher: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Published Date</label>
                    <input
                      type="date"
                      value={formData.publishedDate}
                      onChange={e => setFormData({ ...formData, publishedDate: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  />
                </div>
             </div>

             {/* Authors Selection */}
             <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest text-[10px]">Select Authors</label>
                <div className="flex flex-wrap gap-2">
                  {authors.map(author => (
                    <button
                      key={author.id}
                      type="button"
                      onClick={() => toggleSelection('authorIds', author.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        formData.authorIds.includes(author.id)
                          ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-500/20'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-primary-500'
                      }`}
                    >
                      {author.name}
                    </button>
                  ))}
                  {authors.length === 0 && <p className="text-xs text-gray-400">No authors found. Please add them in Author Management.</p>}
                </div>
             </div>

             {/* Categories Selection */}
             <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest text-[10px]">Select Categories</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleSelection('categoryIds', cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        formData.categoryIds.includes(cat.id)
                          ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-amber-500'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                  {categories.length === 0 && <p className="text-xs text-gray-400">No categories found. Please add them in Category Management.</p>}
                </div>
             </div>

             <div className="pt-6 border-t border-gray-50 dark:border-gray-700">
                <button
                  disabled={loading}
                  className="w-full flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/25 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="mr-2" size={20} />
                      {id ? 'Update Book' : 'Publish Book'}
                    </>
                  )}
                </button>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BookAddEdit;
