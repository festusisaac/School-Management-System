import React, { useEffect, useState } from 'react';
import { libraryService, Category } from '../../services/library.service';
import { DataTable } from '../../components/ui/data-table';
import { Modal } from '../../components/ui/modal';
import { useToast } from '../../context/ToastContext';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash, Plus } from 'lucide-react';

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category> | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await libraryService.getCategories();
      setCategories(data);
    } catch (err) {
      showError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory?.name) return;

    try {
      if (currentCategory.id) {
        await libraryService.updateCategory(currentCategory.id, { name: currentCategory.name, description: currentCategory.description });
        showSuccess('Category updated successfully');
      } else {
        await libraryService.createCategory({ name: currentCategory.name, description: currentCategory.description });
        showSuccess('Category created successfully');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      showError('Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await libraryService.deleteCategory(id);
      showSuccess('Category deleted successfully');
      fetchCategories();
    } catch (err) {
      showError('Failed to delete category');
    }
  };

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.original.name}</span>
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <span className="text-gray-500 dark:text-gray-400 line-clamp-1">{row.original.description || '-'}</span>
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentCategory(row.original);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage library book categories/genres.</p>
        </div>
        <button
          onClick={() => {
            setCurrentCategory({ name: '', description: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Add Category
        </button>
      </div>

      <DataTable 
        columns={columns} 
        data={categories} 
        searchKey="name" 
        placeholder="Search categories..." 
        loading={loading} 
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentCategory?.id ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              required
              value={currentCategory?.name || ''}
              onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder="e.g. Science Fiction, Reference, Textbook"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={currentCategory?.description || ''}
              onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder="Brief description"
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
              Save Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
