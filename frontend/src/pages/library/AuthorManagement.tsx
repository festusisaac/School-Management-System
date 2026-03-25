import React, { useEffect, useState } from 'react';
import { libraryService, Author } from '../../services/library.service';
import { DataTable } from '../../components/ui/data-table';
import { Modal } from '../../components/ui/modal';
import { useToast } from '../../context/ToastContext';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash, Plus } from 'lucide-react';

const AuthorManagement: React.FC = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAuthor, setCurrentAuthor] = useState<Partial<Author> | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const data = await libraryService.getAuthors();
      setAuthors(data);
    } catch (err) {
      showError('Failed to fetch authors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAuthor?.name) return;

    try {
      if (currentAuthor.id) {
        await libraryService.updateAuthor(currentAuthor.id, { name: currentAuthor.name, bio: currentAuthor.bio });
        showSuccess('Author updated successfully');
      } else {
        await libraryService.createAuthor({ name: currentAuthor.name, bio: currentAuthor.bio });
        showSuccess('Author created successfully');
      }
      setIsModalOpen(false);
      fetchAuthors();
    } catch (err) {
      showError('Failed to save author');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this author?')) return;
    try {
      await libraryService.deleteAuthor(id);
      showSuccess('Author deleted successfully');
      fetchAuthors();
    } catch (err) {
      showError('Failed to delete author');
    }
  };

  const columns: ColumnDef<Author>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.original.name}</span>
    },
    {
      accessorKey: 'bio',
      header: 'Bio',
      cell: ({ row }) => <span className="text-gray-500 dark:text-gray-400 line-clamp-1">{row.original.bio || '-'}</span>
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentAuthor(row.original);
              setIsModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Authors</h1>
          <p className="text-sm text-gray-500 mt-1">Manage library book authors.</p>
        </div>
        <button
          onClick={() => {
            setCurrentAuthor({ name: '', bio: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Add Author
        </button>
      </div>

      <DataTable 
        columns={columns} 
        data={authors} 
        searchKey="name" 
        placeholder="Search authors..." 
        loading={loading} 
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentAuthor?.id ? 'Edit Author' : 'Add Author'}
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              required
              value={currentAuthor?.name || ''}
              onChange={(e) => setCurrentAuthor({ ...currentAuthor, name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder="Author name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
            <textarea
              rows={3}
              value={currentAuthor?.bio || ''}
              onChange={(e) => setCurrentAuthor({ ...currentAuthor, bio: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder="Brief biography"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
            >
              Save Author
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AuthorManagement;
