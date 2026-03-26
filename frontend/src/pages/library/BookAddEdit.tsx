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
    edition: '',
    language: '',
    authorIds: [] as string[],
    categoryIds: [] as string[],
    initialCopies: 0,
    startingBarcode: '',
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Quick Add State
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newAuthor, setNewAuthor] = useState({ name: '', bio: '' });
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [savingQuick, setSavingQuick] = useState(false);

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
          edition: (book as any).edition || '',
          language: (book as any).language || '',
          authorIds: book.authors?.map(a => a.id) || [],
          categoryIds: book.categories?.map(c => c.id) || [],
          initialCopies: 0,
          startingBarcode: '',
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

  const handleQuickAddAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQuick(true);
    try {
      const added = await libraryService.createAuthor(newAuthor);
      setAuthors(prev => [...prev, added].sort((a,b) => a.name.localeCompare(b.name)));
      toggleSelection('authorIds', added.id);
      setIsAuthorModalOpen(false);
      setNewAuthor({ name: '', bio: '' });
      showSuccess('Author added');
    } catch (err) { showError('Failed to add author'); }
    finally { setSavingQuick(false); }
  };

  const handleQuickAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQuick(true);
    try {
      const added = await libraryService.createCategory(newCategory);
      setCategories(prev => [...prev, added].sort((a,b) => a.name.localeCompare(b.name)));
      toggleSelection('categoryIds', added.id);
      setIsCategoryModalOpen(false);
      setNewCategory({ name: '', description: '' });
      showSuccess('Category added');
    } catch (err) { showError('Failed to add category'); }
    finally { setSavingQuick(false); }
  };

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
        fd.append(key, value.toString());
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
        showSuccess('Book published with inventory units');
      }
      navigate('/library');
    } catch (err) {
      showError('Failed to save book');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-20 text-center animate-pulse text-xs font-black uppercase tracking-widest text-gray-400">Loading catalog data...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/library" className="p-2 mb-1 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {id ? 'Modify Record' : 'Catalog New Title'}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Librarian cataloging interface</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Cover Upload */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
            <h3 className="text-[10px] font-black text-gray-300 mb-4 uppercase tracking-[0.2em]">Front Cover</h3>
            <div className="relative group mx-auto w-full aspect-[3/4] bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center transition-colors hover:border-primary-500/50">
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
                <div className="text-gray-400 flex flex-col items-center p-8">
                  <Upload size={32} strokeWidth={1} />
                  <span className="text-[10px] mt-4 font-black uppercase tracking-widest leading-tight">Drop cover art here</span>
                  <span className="text-[9px] mt-1 font-bold opacity-40 uppercase">JPG/PNG/WEBP</span>
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

          {/* Initial Inventory Section - Only for ADD */}
          {!id && (
            <div className="bg-primary-50 dark:bg-primary-900/10 p-6 rounded-2xl border border-primary-100 dark:border-primary-900/20 space-y-4">
              <h3 className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">Stock Setup</h3>
              <div className="space-y-3">
                 <div>
                    <label className="block text-[9px] font-black text-primary-800 dark:text-primary-300 uppercase mb-1">Number of Copies</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.initialCopies}
                      onChange={e => setFormData({ ...formData, initialCopies: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-white dark:bg-gray-900 border border-primary-200 dark:border-primary-800 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-[9px] font-black text-primary-800 dark:text-primary-300 uppercase mb-1">Starting Accession / Barcode</label>
                    <input
                      placeholder="e.g. LIB-001"
                      value={formData.startingBarcode}
                      onChange={e => setFormData({ ...formData, startingBarcode: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-white dark:bg-gray-900 border border-primary-200 dark:border-primary-800 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                 </div>
                 <p className="text-[8px] text-primary-600/60 font-medium leading-tight">System will automatically increment IDs (e.g. LIB-001, LIB-002...)</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Details Form */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
             <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Book Title *</label>
                      <input
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Complete title of the work"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ISBN</label>
                      <input
                        value={formData.isbn}
                        onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                        placeholder="ISBN-10 or 13"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                   <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Publisher</label>
                      <input
                        value={formData.publisher}
                        onChange={e => setFormData({ ...formData, publisher: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Released On</label>
                      <input
                        type="date"
                        value={formData.publishedDate}
                        onChange={e => setFormData({ ...formData, publishedDate: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Edition</label>
                      <input
                        value={formData.edition}
                        onChange={e => setFormData({ ...formData, edition: e.target.value })}
                        placeholder="e.g. 2nd Ed"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Language</label>
                      <input
                        value={formData.language}
                        onChange={e => setFormData({ ...formData, language: e.target.value })}
                        placeholder="English, French, etc."
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Metadata / Description</label>
                      <textarea
                        rows={1}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Synopsis or internal notes"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold resize-none"
                      />
                   </div>
                </div>
             </div>

             {/* Authors Selection */}
             <div className="space-y-3">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Select Authors</label>
                   <button 
                     type="button"
                     onClick={() => setIsAuthorModalOpen(true)}
                     className="text-[9px] font-black uppercase text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-900/10 px-2 py-1 rounded-md"
                   >
                     + Quick Add
                   </button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl border border-gray-100/50 dark:border-gray-800/50">
                  {authors.map(author => (
                    <button
                      key={author.id}
                      type="button"
                      onClick={() => toggleSelection('authorIds', author.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all border ${
                        formData.authorIds.includes(author.id)
                          ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/20'
                          : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-primary-500'
                      }`}
                    >
                      {author.name}
                    </button>
                  ))}
                  {authors.length === 0 && <p className="text-[10px] text-gray-300 font-bold uppercase italic p-1">No authors in database</p>}
                </div>
             </div>

             {/* Categories Selection */}
             <div className="space-y-3">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Book Categories</label>
                   <button 
                     type="button"
                     onClick={() => setIsCategoryModalOpen(true)}
                     className="text-[9px] font-black uppercase text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-900/10 px-2 py-1 rounded-md"
                   >
                     + Quick Add
                   </button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl border border-gray-100/50 dark:border-gray-800/50">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleSelection('categoryIds', cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all border ${
                        formData.categoryIds.includes(cat.id)
                          ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                          : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-amber-500'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                  {categories.length === 0 && <p className="text-[10px] text-gray-300 font-bold uppercase italic p-1">No genres defined</p>}
                </div>
             </div>

             <div className="pt-6 border-t border-gray-50 dark:border-gray-800 flex justify-end">
                <button
                  disabled={loading}
                  className="px-10 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:opacity-90 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {id ? 'Commit Changes' : 'Publish Title'}
                    </>
                  )}
                </button>
             </div>
          </div>
        </div>
      </form>

      {/* Quick Add Modals */}
      {isAuthorModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-gray-800 w-full max-w-md p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 space-y-6">
              <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">New Author Entry</h2>
              <form onSubmit={handleQuickAddAuthor} className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Full Name</label>
                    <input autoFocus required value={newAuthor.name} onChange={e => setNewAuthor({...newAuthor, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border-transparent focus:ring-2 focus:ring-primary-500 outline-none font-bold text-sm" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Biography/Notes</label>
                    <textarea value={newAuthor.bio} onChange={e => setNewAuthor({...newAuthor, bio: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border-transparent focus:ring-2 focus:ring-primary-500 outline-none font-bold text-sm resize-none" rows={3} />
                 </div>
                 <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setIsAuthorModalOpen(false)} className="flex-1 py-3 text-xs font-black uppercase text-gray-400">Cancel</button>
                    <button disabled={savingQuick} type="submit" className="flex-1 py-3 bg-primary-600 text-white text-xs font-black uppercase rounded-xl shadow-lg shadow-primary-500/20">{savingQuick ? '...' : 'Add Author'}</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-gray-800 w-full max-w-md p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 space-y-6">
              <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">New Library Category</h2>
              <form onSubmit={handleQuickAddCategory} className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Category Name</label>
                    <input autoFocus required value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border-transparent focus:ring-2 focus:ring-amber-500 outline-none font-bold text-sm" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Description</label>
                    <textarea value={newCategory.description} onChange={e => setNewCategory({...newCategory, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border-transparent focus:ring-2 focus:ring-amber-500 outline-none font-bold text-sm resize-none" rows={3} />
                 </div>
                 <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 py-3 text-xs font-black uppercase text-gray-400">Cancel</button>
                    <button disabled={savingQuick} type="submit" className="flex-1 py-3 bg-amber-500 text-white text-xs font-black uppercase rounded-xl shadow-lg shadow-amber-500/20">{savingQuick ? '...' : 'Add Category'}</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default BookAddEdit;
