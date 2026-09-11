import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/error';
import {
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  X,
  Upload,
  Loader2,
  AlertTriangle,
  MoveUp,
  MoveDown,
  ArrowUp,
  ArrowDown,
  Info,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
}

interface ExcelImportResult {
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  errors: string[];
}

interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
}

interface ProductVariant {
  id?: number;
  size: string;
  color: string;
  price: number;
  stock: number;
  sku: string;
  imageUrl?: string;
  imageUrls?: string[];
}

interface Product {
  id: number;
  name: string;
  description: string;
  brand: string;
  categoryId: number;
  category?: { id: number; name: string };
  categoryName?: string;
  isActive: boolean;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  totalStock?: number;
  totalVariants?: number;
  inStockVariants?: number;
  outOfStockVariants?: number;
  thumbnailImage?: string;
  additionalImages?: string[];
  variants?: ProductVariant[];
}

export default function Products() {
  useEffect(() => {
    document.title = 'Product Catalog | Haus of Hafsah Admin';
  }, []);

  // Lists State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Form State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Excel Import/Export States
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  
  // Product Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('Haus of Hafsah');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  
  // Image Upload State
  const [thumbnailImage, setThumbnailImage] = useState<string>('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Variants State
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Deletion Modal State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Recommendations pairings state
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [recSearchQuery, setRecSearchQuery] = useState('');
  const [recSearchResults, setRecSearchResults] = useState<Product[]>([]);
  const [recSearching, setRecSearching] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await api.get<Category[]>('/categories');
      setCategories(data || []);
    } catch {
      // Ignored
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (selectedCategory) queryParams.append('categoryId', selectedCategory);
      if (selectedStatus) queryParams.append('status', selectedStatus);
      queryParams.append('page', page.toString());
      queryParams.append('size', '10');

      const response = await api.get<PaginatedResponse<Product> | Product[]>(`/admin/products?${queryParams.toString()}`);
      if (response && 'content' in response) {
        setProducts(response.content);
        setTotalPages(response.totalPages);
      } else {
        // Fallback if returned raw list
        setProducts(Array.isArray(response) ? response : []);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load products list'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial categories and products on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory, selectedStatus, page]);

  // Drawer Actions
  const handleOpenNewDrawer = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setBrand('Haus of Hafsah');
    setCategoryId('');
    setIsActive(true);
    setThumbnailImage('');
    setAdditionalImages([]);
    setVariants([
      { size: 'S', color: 'Black', price: 99, stock: 15, sku: '' }
    ]);
    setRecommendations([]);
    setDrawerOpen(true);
  };

  const handleOpenEditDrawer = async (product: Product) => {
    try {
      setLoading(true);
      // Fetch complete details including variants and category
      const details = await api.get<any>(`/products/${product.id}`);
      setEditingProduct(details);
      setName(details.name || '');
      setDescription(details.description || '');
      setBrand(details.brand || 'Haus of Hafsah');

      const catId = details.category?.id || details.categoryId || (typeof details.category === 'number' ? details.category : '');
      setCategoryId(catId ? Number(catId) : '');

      setIsActive(details.isActive ?? (details.status === 'ACTIVE'));
      setThumbnailImage(details.thumbnailImage || '');
      setAdditionalImages(details.additionalImages || []);

      const mappedVariants = (details.variants || []).map((v: any) => ({
        id: v.id,
        size: v.size || '',
        color: v.color || '',
        price: v.price != null ? Number(v.price) : 0,
        stock: v.stockQuantity != null ? Number(v.stockQuantity) : (v.stock != null ? Number(v.stock) : 0),
        sku: v.sku || '',
        imageUrl: v.publicImageUrl || v.imageUrl || '',
        imageUrls: v.additionalImageUrls || v.imageUrls || [],
      }));

      setVariants(mappedVariants.length > 0 ? mappedVariants : [
        { size: 'S', color: 'Black', price: 99, stock: 15, sku: '' }
      ]);

      // Fetch recommendations
      try {
        const recs = await api.get<Product[]>(`/admin/products/${product.id}/recommendations`);
        setRecommendations(recs || []);
      } catch {
        setRecommendations([]);
      }
      setDrawerOpen(true);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load product details'));
    } finally {
      setLoading(false);
    }
  };

  // Image Upload helper
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const fileList = Array.from(files);
      const formData = new FormData();
      fileList.forEach(file => formData.append('files', file));
      formData.append('folder', 'products');
      formData.append('entityId', editingProduct?.id ? String(editingProduct.id) : 'temp-creation');

      const uploaded = await api.post<Array<{ fileUrl: string }>>('/images/upload-multiple', formData);
      if (uploaded && uploaded.length > 0) {
        const urls = uploaded.map(img => img.fileUrl);
        if (!thumbnailImage) {
          setThumbnailImage(urls[0]);
          setAdditionalImages(prev => [...prev, ...urls.slice(1)]);
        } else {
          setAdditionalImages(prev => [...prev, ...urls]);
        }
        toast.success('Images uploaded successfully');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Image upload failed'));
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (url: string) => {
    if (thumbnailImage === url) {
      if (additionalImages.length > 0) {
        setThumbnailImage(additionalImages[0]);
        setAdditionalImages(prev => prev.slice(1));
      } else {
        setThumbnailImage('');
      }
    } else {
      setAdditionalImages(prev => prev.filter(img => img !== url));
    }
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const images = [thumbnailImage, ...additionalImages].filter(Boolean);
    if (direction === 'up' && index > 0) {
      const temp = images[index - 1];
      images[index - 1] = images[index];
      images[index] = temp;
    } else if (direction === 'down' && index < images.length - 1) {
      const temp = images[index + 1];
      images[index + 1] = images[index];
      images[index] = temp;
    }
    setThumbnailImage(images[0] || '');
    setAdditionalImages(images.slice(1));
  };

  // Variants helpers
  const handleAddVariant = () => {
    setVariants([...variants, { size: 'S', color: 'Black', price: 99, stock: 15, sku: '' }]);
  };

  const handleRemoveVariant = (idx: number) => {
    if (variants.length <= 1) {
      toast.error('At least one product variant is required.');
      return;
    }
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleVariantChange = (idx: number, field: keyof ProductVariant, value: string | number) => {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: value };
    
    // Auto generate SKU if empty
    if (field === 'size' || field === 'color') {
      const v = updated[idx];
      const prodShortName = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) : 'prod';
      const sizeShort = v.size ? v.size.toLowerCase() : 's';
      const colorShort = v.color ? v.color.toLowerCase().slice(0, 3) : 'col';
      if (!v.sku || v.sku.startsWith('hoh-')) {
        v.sku = `hoh-${prodShortName}-${colorShort}-${sizeShort}`;
      }
    }
    setVariants(updated);
  };

  // Recommendations helpers
  const handleRecSearch = async (query: string) => {
    setRecSearchQuery(query);
    if (!query.trim()) {
      setRecSearchResults([]);
      return;
    }

    try {
      setRecSearching(true);
      const res = await api.get<{ content: Product[] } | Product[]>(`/admin/products?search=${encodeURIComponent(query)}&size=10`);
      if (res) {
        if ('content' in res) {
          const filtered = res.content.filter((p) => p.id !== editingProduct?.id);
          setRecSearchResults(filtered);
        } else {
          const list = Array.isArray(res) ? res : [];
          const filtered = list.filter((p) => p.id !== editingProduct?.id);
          setRecSearchResults(filtered);
        }
      }
    } catch {
      // Ignored
    } finally {
      setRecSearching(false);
    }
  };

  const addRecommendation = (product: Product) => {
    if (recommendations.some((p) => p.id === product.id)) {
      toast.error('Product is already recommended');
      return;
    }
    setRecommendations([...recommendations, product]);
    setRecSearchQuery('');
    setRecSearchResults([]);
    toast.success(`${product.name} added to recommendations`);
  };

  const removeRecommendation = (id: number) => {
    setRecommendations(recommendations.filter((p) => p.id !== id));
  };

  const moveRecommendation = (index: number, direction: 'up' | 'down') => {
    const newRecs = [...recommendations];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newRecs.length) return;

    const temp = newRecs[index];
    newRecs[index] = newRecs[targetIndex];
    newRecs[targetIndex] = temp;
    setRecommendations(newRecs);
  };

  // Submit Product Form
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }

    setUploadingImages(true);
    try {
      const payload = {
        name,
        description,
        brand,
        categoryId: Number(categoryId),
        isActive,
        thumbnailImage,
        additionalImages,
        variants: variants.map(v => ({
          id: v.id,
          size: v.size,
          color: v.color,
          price: Number(v.price),
          stockQuantity: Number(v.stock),
          sku: v.sku || `hoh-${name.toLowerCase().slice(0, 5)}-${v.color.slice(0, 3)}-${v.size}`,
          publicImageUrl: v.imageUrl || '',
          additionalImageUrls: v.imageUrls || [],
        }))
      };

      if (editingProduct) {
        // Update product (PUT accepts application/json)
        await api.put(`/admin/products/${editingProduct.id}`, payload);
        // Save recommendations live
        await api.put(`/admin/products/${editingProduct.id}/recommendations`, {
          recommendedProductIds: recommendations.map((r) => r.id),
        });
        toast.success('Product updated successfully!');
      } else {
        // Create product — backend expects multipart/form-data with a "product" JSON part
        const formData = new FormData();
        formData.append(
          'product',
          new Blob([JSON.stringify(payload)], { type: 'application/json' })
        );
        await api.post('/admin/products', formData);
        toast.success('Product created successfully!');
      }
      setDrawerOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save product'));
    } finally {
      setUploadingImages(false);
    }
  };

  // Delete Action
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await api.delete(`/admin/products/${deletingProduct.id}`);
      toast.success('Product has been deleted');
      setDeletingProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete product'));
    }
  };

  // Excel Import/Export handlers
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = ''; // Reset target value

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post<ExcelImportResult>('/admin/excel/import/products', formData);
      setImportResult(res);
      toast.success('Import completed!');
      fetchProducts();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Import failed'));
    } finally {
      setImporting(false);
    }
  };

  const handleExcelExport = async () => {
    try {
      setExporting(true);
      await api.download('/admin/excel/export/products', 'products_catalog.xlsx');
      toast.success('Products exported successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to export products'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-surface border border-border p-4 rounded-md">
        <div className="flex flex-1 gap-3 max-w-lg items-center">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search products by title, brand, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border pl-9 pr-3 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-background border border-border px-3 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-background border border-border px-3 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
          >
            <option value="">Active & Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
            <option value="ALL">All Statuses</option>
          </select>
        </div>

        <div className="flex gap-2">
          {/* File input for import */}
          <input
            type="file"
            id="excel-import-input"
            accept=".xlsx,.xls"
            onChange={handleExcelImport}
            className="hidden"
          />
          <button
            onClick={() => document.getElementById('excel-import-input')?.click()}
            disabled={importing}
            className="flex items-center justify-center gap-1.5 border border-border hover:bg-background text-text-primary px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer bg-white"
          >
            {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            <span>Import</span>
          </button>
          
          <button
            onClick={handleExcelExport}
            disabled={exporting}
            className="flex items-center justify-center gap-1.5 border border-border hover:bg-background text-text-primary px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer bg-white"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span>Export</span>
          </button>

          <button
            onClick={handleOpenNewDrawer}
            className="flex items-center justify-center gap-1.5 bg-accent hover:bg-accent/90 text-white px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      {loading && products.length === 0 ? (
        <div className="flex justify-center items-center py-20 bg-surface border border-border rounded-md">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <span className="text-xs text-text-secondary ml-2">Loading catalog...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-20 bg-surface border border-border rounded-md text-center">
          <Info className="h-8 w-8 text-text-secondary/50 mb-3" />
          <p className="text-xs font-semibold text-text-primary">No products found</p>
          <p className="text-[11px] text-text-secondary mt-1">Try clearing your filters or create a new product.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-background border-b border-border text-[10px] uppercase font-semibold tracking-wider text-text-secondary">
                  <th className="py-3 px-4 w-16">Image</th>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price Range</th>
                  <th className="py-3 px-4">Total Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {products.map((product) => {
                  const minPrice = product.minPrice ?? 0;
                  const maxPrice = product.maxPrice ?? 0;
                  return (
                    <tr key={product.id} className="hover:bg-background/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="h-11 w-11 rounded border border-border overflow-hidden bg-background">
                          {product.thumbnailImage ? (
                            <img
                              src={product.thumbnailImage}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] text-text-secondary font-medium">
                              No Pic
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-text-primary">{product.name}</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">{product.brand}</p>
                      </td>
                      <td className="py-3 px-4 text-text-secondary font-medium">
                        {product.category?.name || product.categoryName || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-text-primary">
                        {minPrice === maxPrice ? `Rs. ${minPrice.toFixed(2)}` : `Rs. ${minPrice.toFixed(2)} - Rs. ${maxPrice.toFixed(2)}`}
                      </td>
                      <td className="py-3 px-4">
                        {(() => {
                          const total = product.totalStock ?? 0;
                          const totalVar = product.totalVariants ?? 0;
                          const inStock = product.inStockVariants ?? 0;
                          const outOfStock = product.outOfStockVariants ?? 0;

                          if (total === 0) {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                Out of Stock (0 units)
                              </span>
                            );
                          }

                          return (
                            <div className="space-y-0.5">
                              <p className="font-semibold text-text-primary text-xs">
                                {total} {total === 1 ? 'unit' : 'units'}
                              </p>
                              {totalVar > 0 && (
                                <p className="text-[10px] font-medium">
                                  {outOfStock > 0 ? (
                                    <span className="text-amber-700 font-semibold">
                                      {inStock}/{totalVar} variants ({outOfStock} out)
                                    </span>
                                  ) : (
                                    <span className="text-emerald-700 font-semibold">
                                      All {totalVar} variants in stock
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        {(() => {
                          const statusStr = product.status ? product.status.toUpperCase() : (product.isActive ? 'ACTIVE' : 'DRAFT');
                          if (statusStr === 'ARCHIVED') {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                                Archived
                              </span>
                            );
                          }
                          if (statusStr === 'DRAFT') {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-draft/15 text-draft">
                                Draft
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success">
                              Active
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2.5">
                          <a
                            href={`${import.meta.env.VITE_STOREFRONT_URL || 'https://hausofhafsah.com'}/product/${product.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:text-accent text-text-secondary transition-colors"
                            title="Preview on storefront"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleOpenEditDrawer(product)}
                            className="p-1 hover:text-accent text-text-secondary transition-colors"
                            title="Edit product"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="p-1 hover:text-error text-text-secondary transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-background/50">
              <span className="text-[10px] text-text-secondary">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(prev => prev - 1)}
                  className="px-2.5 py-1 border border-border rounded text-[10px] font-semibold uppercase hover:bg-surface transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages - 1}
                  onClick={() => setPage(prev => prev + 1)}
                  className="px-2.5 py-1 border border-border rounded text-[10px] font-semibold uppercase hover:bg-surface transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-step / Single-Scroll Form Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-text-primary/45 backdrop-blur-xs animate-in fade-in">
          {/* Side Drawer Body */}
          <div className="w-full max-w-3xl bg-surface h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-background/50">
              <div>
                <h3 className="font-serif text-lg font-medium text-text-primary">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider mt-0.5">
                  Complete basic info, images, and sizing variants
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-full border border-border bg-surface text-text-secondary hover:text-text-primary"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Scrollable Form Area */}
            <form onSubmit={handleSubmitProduct} className="flex-1 overflow-y-auto p-6 space-y-8 text-xs text-text-secondary">
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <h4 className="font-serif text-sm font-semibold text-text-primary border-b border-border/60 pb-2">
                  1. Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-semibold uppercase text-text-secondary">Product Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ribbed Knit Midi Dress"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-background border border-border rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold uppercase text-text-secondary">Brand Name</label>
                    <input
                      type="text"
                      placeholder="Haus of Hafsah"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full bg-background border border-border rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="block font-semibold uppercase text-text-secondary">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-background border border-border rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="block font-semibold uppercase text-text-secondary">Product Description</label>
                    <textarea
                      rows={3}
                      placeholder="Enter fabric specifications, length coordinates, and styling recommendations..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-background border border-border rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Images Upload Grid */}
              <div className="space-y-4">
                <h4 className="font-serif text-sm font-semibold text-text-primary border-b border-border/60 pb-2 flex justify-between items-center">
                  <span>2. Product Images</span>
                  <span className="text-[10px] font-normal lowercase italic text-text-secondary">
                    First picture is used as the product listing thumbnail
                  </span>
                </h4>
                
                {/* Image List Drag/Reorder Mock Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[thumbnailImage, ...additionalImages].filter(Boolean).map((imgUrl, idx) => (
                    <div key={imgUrl} className="relative aspect-square rounded border border-border bg-background overflow-hidden group">
                      <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-text-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveImage(idx, 'up')}
                          className="p-1 bg-surface rounded text-text-secondary hover:text-text-primary disabled:opacity-50"
                        >
                          <MoveUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === [thumbnailImage, ...additionalImages].filter(Boolean).length - 1}
                          onClick={() => handleMoveImage(idx, 'down')}
                          className="p-1 bg-surface rounded text-text-secondary hover:text-text-primary disabled:opacity-50"
                        >
                          <MoveDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(imgUrl)}
                          className="p-1 bg-surface rounded text-error hover:scale-105 transition-transform"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-accent text-white px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}

                  {/* Add Image Zone */}
                  <button
                    type="button"
                    disabled={uploadingImages}
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border border-dashed border-border rounded flex flex-col items-center justify-center bg-background hover:bg-background/50 hover:border-accent/40 transition-colors disabled:opacity-50 text-text-secondary cursor-pointer"
                  >
                    {uploadingImages ? (
                      <Loader2 className="h-5 w-5 animate-spin text-accent" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-text-secondary mb-1.5" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Upload Images</span>
                      </>
                    )}
                  </button>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Section 3: Sizing Variants Repeaters */}
              <div className="space-y-4">
                <h4 className="font-serif text-sm font-semibold text-text-primary border-b border-border/60 pb-2 flex justify-between items-center">
                  <span>3. Sizes & Colors Inventory</span>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-accent hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Variant</span>
                  </button>
                </h4>

                <div className="space-y-3.5">
                  {variants.map((v, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end bg-background/40 border border-border/60 p-3.5 rounded relative group">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 flex-1">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold uppercase text-text-secondary">Size</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. S, M, L, XL"
                            value={v.size}
                            onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                            className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold uppercase text-text-secondary">Color</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ivory, Taupe"
                            value={v.color}
                            onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                            className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold uppercase text-text-secondary">Price (Rs.)</label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={v.price}
                            onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold uppercase text-text-secondary">Stock Quantity</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={v.stock}
                            onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value) || 0)}
                            className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-semibold uppercase text-text-secondary">SKU Code</label>
                          <input
                            type="text"
                            placeholder="hoh-dress-blk-s"
                            value={v.sku}
                            onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                            className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-[11px] text-text-primary focus:outline-none"
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="p-1.5 bg-surface border border-border text-error rounded hover:bg-error/5 hover:border-error/25 self-start sm:self-end"
                        title="Remove Variant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Complete the Look Recommendations (Only when editing) */}
              {editingProduct && (
                <div className="space-y-4 pt-4 border-t border-border/40">
                  <h4 className="font-serif text-sm font-semibold text-text-primary border-b border-border/60 pb-2">
                    4. Complete the Look Recommendations
                  </h4>
                  
                  {/* Search and Picker */}
                  <div className="space-y-2 relative">
                    <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                      Search & Add Styling Pairings
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={recSearchQuery}
                        onChange={(e) => handleRecSearch(e.target.value)}
                        placeholder="Search product to recommend..."
                        className="w-full bg-background border border-border rounded px-3 py-2 pl-8 text-xs focus:outline-none text-text-primary"
                      />
                      {recSearching ? (
                        <Loader2 className="absolute left-2.5 top-2.5 h-3.5 w-3.5 animate-spin text-text-secondary" />
                      ) : (
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-secondary" />
                      )}
                    </div>

                    {/* Suggestions list */}
                    {recSearchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border rounded shadow-lg max-h-40 overflow-y-auto z-10 space-y-0.5 p-1">
                        {recSearchResults.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addRecommendation(product)}
                            className="w-full flex items-center gap-3 px-2 py-1.5 hover:bg-background text-left rounded transition-colors text-xs text-text-primary"
                          >
                            {product.thumbnailImage ? (
                              <img
                                src={product.thumbnailImage}
                                alt={product.name}
                                className="h-8 w-6 object-cover rounded bg-beige/25"
                              />
                            ) : (
                              <div className="h-8 w-6 bg-beige/40 rounded flex items-center justify-center text-[8px]">
                                Haus
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{product.name}</p>
                              <p className="text-[10px] text-text-secondary">{product.brand}</p>
                            </div>
                            <Plus className="h-3.5 w-3.5 text-accent" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recommendation List */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                      Recommended Pairing Items ({recommendations.length})
                    </label>
                    {recommendations.length === 0 ? (
                      <p className="text-xs text-text-secondary italic text-center py-4 bg-background/50 rounded border border-dashed border-border/60">
                        No custom pairings set. Will fallback to category related products automatically.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {recommendations.map((product, index) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 p-2 bg-background border border-border rounded shadow-xs"
                          >
                            {product.thumbnailImage ? (
                              <img
                                src={product.thumbnailImage}
                                alt={product.name}
                                className="h-10 w-8 object-cover rounded bg-beige/25 flex-shrink-0"
                              />
                            ) : (
                              <div className="h-10 w-8 bg-beige/40 rounded flex items-center justify-center text-[8px] flex-shrink-0">
                                Haus
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-text-primary truncate">
                                {product.name}
                              </p>
                              <p className="text-[10px] text-text-secondary">{product.brand}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveRecommendation(index, 'up')}
                                disabled={index === 0}
                                className="p-1 hover:bg-surface text-text-secondary hover:text-text-primary disabled:opacity-30 rounded transition-colors"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveRecommendation(index, 'down')}
                                disabled={index === recommendations.length - 1}
                                className="p-1 hover:bg-surface text-text-secondary hover:text-text-primary disabled:opacity-30 rounded transition-colors"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeRecommendation(product.id)}
                                className="p-1 hover:bg-error/15 text-error rounded transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>

            {/* Actions Bar Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-background/50">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <label htmlFor="isActive" className="text-text-primary font-semibold cursor-pointer">
                  Activate & Publish to Store
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-2 border border-border rounded text-xs font-semibold uppercase hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={uploadingImages}
                  onClick={(e) => {
                    setIsActive(false);
                    // Trigger submit manually after set state completes (or immediately pass override value)
                    setTimeout(() => handleSubmitProduct(e), 50);
                  }}
                  className="px-4 py-2 bg-surface border border-border text-text-primary rounded text-xs font-semibold uppercase hover:bg-background transition-colors disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={uploadingImages}
                  onClick={(e) => {
                    setIsActive(true);
                    setTimeout(() => handleSubmitProduct(e), 50);
                  }}
                  className="px-5 py-2 bg-accent hover:bg-accent/90 text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {uploadingImages ? 'Saving...' : 'Save & Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/45 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border max-w-md w-full rounded-lg shadow-xl p-6 space-y-6 mx-4 animate-in zoom-in duration-200">
            <div className="flex gap-3 text-error">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <div>
                <h3 className="font-serif text-base font-semibold text-text-primary">
                  Delete Product catalog item?
                </h3>
                <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                  "This will remove the product <strong className="text-text-primary">{deletingProduct.name}</strong> from your store. Customers won't be able to see or buy it anymore."
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 border-t border-border/60 pt-4">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-1.5 border border-border rounded text-xs font-semibold uppercase hover:bg-background transition-colors"
              >
                No, Keep it
              </button>
              <button
                onClick={handleDeleteProduct}
                className="px-4 py-1.5 bg-error text-white rounded text-xs font-semibold uppercase hover:bg-error/95 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Result Dialog */}
      {importResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-surface border border-border rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-serif text-base font-bold text-text-primary">
                Import Report
              </h3>
              <button
                onClick={() => setImportResult(null)}
                className="p-1 hover:bg-background rounded-md text-text-secondary hover:text-text-primary transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div className="bg-background border border-border p-3 rounded-md">
                <span className="text-[10px] text-text-secondary uppercase font-semibold">Total Rows</span>
                <span className="block font-serif text-lg font-bold text-text-primary mt-1">{importResult.totalRows}</span>
              </div>
              <div className="bg-success/5 border border-success/15 p-3 rounded-md">
                <span className="text-[10px] text-success uppercase font-semibold">Successful</span>
                <span className="block font-serif text-lg font-bold text-success mt-1">{importResult.successfulImports}</span>
              </div>
              <div className="bg-error/5 border border-error/15 p-3 rounded-md">
                <span className="text-[10px] text-error uppercase font-semibold">Failed</span>
                <span className="block font-serif text-lg font-bold text-error mt-1">{importResult.failedImports}</span>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Row-Level Errors</span>
                <div className="bg-background border border-border rounded-md p-3 max-h-40 overflow-y-auto text-[11px] text-error space-y-1 font-mono">
                  {importResult.errors.map((err, idx) => (
                    <div key={idx} className="flex gap-1.5 items-start">
                      <span className="shrink-0">•</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border/40">
              <button
                onClick={() => setImportResult(null)}
                className="bg-accent text-background hover:bg-accent/90 px-4 py-2 text-xs font-semibold rounded-md transition cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
