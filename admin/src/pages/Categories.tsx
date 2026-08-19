import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/error';
import {
  Plus,
  Trash2,
  Edit,
  X,
  Loader2,
  AlertTriangle,
  FolderPlus,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Delete modal state
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await api.get<Category[]>('/categories');
      setCategories(data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load categories'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    try {
      setAddingCategory(true);
      const payload = { name: newCategoryName.trim() };
      await api.post('/admin/categories', payload);
      toast.success('Category created successfully!');
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create category'));
    } finally {
      setAddingCategory(false);
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditCategoryName('');
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editCategoryName.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    try {
      setAddingCategory(true);
      const payload = { name: editCategoryName.trim() };
      await api.put(`/admin/categories/${editingCategory.id}`, payload);
      toast.success('Category updated successfully!');
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update category'));
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      setAddingCategory(true);
      await api.delete(`/admin/categories/${deletingCategory.id}`);
      toast.success('Category deleted successfully');
      setDeletingCategory(null);
      fetchCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete category'));
    } finally {
      setAddingCategory(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List Panel */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-surface border border-border p-5 rounded-md space-y-4">
          <h3 className="font-serif text-base font-semibold text-text-primary">
            Store Product Categories
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Categories group your store inventory catalog items (e.g. Knitwear, Outerwear). Modifications here will reflect instantly on the customer-facing storefront filters.
          </p>
        </div>

        {loading && categories.length === 0 ? (
          <div className="flex justify-center items-center py-20 bg-surface border border-border rounded-md">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <span className="text-xs text-text-secondary ml-2 font-medium">Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex justify-center items-center py-20 bg-surface border border-border rounded-md text-center">
            <p className="text-xs text-text-secondary">No categories created yet.</p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-md overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-background border-b border-border text-[10px] uppercase font-semibold tracking-wider text-text-secondary">
                  <th className="py-3 px-6 w-24">ID</th>
                  <th className="py-3 px-6">Category Name</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-background/20 transition-colors">
                    <td className="py-3.5 px-6 text-text-secondary font-mono">
                      #{category.id}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-text-primary">
                      {editingCategory?.id === category.id ? (
                        <form onSubmit={handleUpdateCategory} className="flex items-center gap-2 max-w-sm">
                          <input
                            type="text"
                            required
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            className="bg-background border border-border rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-primary flex-1"
                          />
                          <button
                            type="submit"
                            disabled={addingCategory}
                            className="p-1 hover:text-accent text-text-secondary disabled:opacity-50"
                            title="Save changes"
                          >
                            <Save className="h-4.5 w-4.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="p-1 hover:text-error text-text-secondary"
                            title="Cancel edit"
                          >
                            <X className="h-4.5 w-4.5" />
                          </button>
                        </form>
                      ) : (
                        <span>{category.name}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {editingCategory?.id !== category.id && (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleStartEdit(category)}
                            className="p-1 hover:text-accent text-text-secondary transition-colors"
                            title="Edit category"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingCategory(category)}
                            className="p-1 hover:text-error text-text-secondary transition-colors"
                            title="Delete category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Category Panel */}
      <div className="space-y-4">
        <div className="bg-surface border border-border p-5 rounded-md space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <FolderPlus className="h-5 w-5" />
            <h4 className="font-serif text-sm font-semibold text-text-primary">
              Create New Category
            </h4>
          </div>

          <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="block font-semibold uppercase text-text-secondary">Category Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Formal Wear, Linen Collection"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full bg-background border border-border rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
              />
            </div>

            <button
              type="submit"
              disabled={addingCategory}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              {addingCategory ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>Add Category</span>
            </button>
          </form>
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/45 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border max-w-sm w-full rounded-lg shadow-xl p-5 space-y-5 mx-4 animate-in zoom-in duration-200">
            <div className="flex gap-3 text-error">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <div>
                <h3 className="font-serif text-base font-semibold text-text-primary">
                  Delete Category?
                </h3>
                <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                  Are you sure you want to delete <strong className="text-text-primary">{deletingCategory.name}</strong>? This action cannot be undone, and any products assigned to this category may lose their reference.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border/60 pt-3.5">
              <button
                onClick={() => setDeletingCategory(null)}
                className="px-3.5 py-1.5 border border-border rounded text-xs font-semibold uppercase hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={addingCategory}
                className="px-3.5 py-1.5 bg-error text-white rounded text-xs font-semibold uppercase hover:bg-error/95 transition-colors flex items-center gap-1.5"
              >
                {addingCategory && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
