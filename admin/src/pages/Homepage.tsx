import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/error';
import {
  Upload,
  Loader2,
  Eye,
  Save,
  Send,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  brand: string;
  thumbnailImage?: string;
  minPrice?: number;
}

interface HomepageConfigResponse {
  heroTitle: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  featuredProducts: Product[];
  isPreview?: boolean;
  updatedAt?: string;
}

export default function Homepage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    document.title = 'Homepage CMS — Haus of Hafsah Admin';
  }, []);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get<HomepageConfigResponse>('/admin/homepage');
      if (res) {
        setHeroTitle(res.heroTitle || '');
        setHeroSubtitle(res.heroSubtitle || '');
        setHeroImageUrl(res.heroImageUrl || '');
        setCtaText(res.ctaText || '');
        setCtaLink(res.ctaLink || '');
        setFeaturedProducts(res.featuredProducts || []);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load homepage configuration'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const payload = {
        heroTitle,
        heroSubtitle,
        heroImageUrl,
        ctaText,
        ctaLink,
        featuredProductIds: featuredProducts.map((p) => p.id),
      };
      await api.put<HomepageConfigResponse>('/admin/homepage', payload);
      toast.success('Draft saved successfully');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save draft'));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      // Automatically save current fields to draft first
      const payload = {
        heroTitle,
        heroSubtitle,
        heroImageUrl,
        ctaText,
        ctaLink,
        featuredProductIds: featuredProducts.map((p) => p.id),
      };
      await api.put<HomepageConfigResponse>('/admin/homepage', payload);
      
      // Perform publish
      await api.patch<HomepageConfigResponse>('/admin/homepage/publish');
      toast.success('Homepage published successfully! Cache revalidated.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to publish homepage config'));
    } finally {
      setPublishing(false);
    }
  };

  const handlePreview = async () => {
    try {
      const res = await api.get<{ previewToken: string }>('/admin/homepage/preview-token');
      const token = res?.previewToken || localStorage.getItem('admin_token') || '';
      const storeHost = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
      const previewUrl = `http://${storeHost}:3000/preview/homepage?token=${encodeURIComponent(token)}`;
      window.open(previewUrl, '_blank');
    } catch {
      const token = localStorage.getItem('admin_token') || '';
      const storeHost = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
      const previewUrl = `http://${storeHost}:3000/preview/homepage?token=${encodeURIComponent(token)}`;
      window.open(previewUrl, '_blank');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await api.post<{ fileUrl: string }>('/admin/homepage/hero-image', formData);
      if (res && res.fileUrl) {
        setHeroImageUrl(res.fileUrl);
        toast.success('Hero image uploaded successfully');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to upload hero image'));
    } finally {
      setUploading(false);
    }
  };

  // Search products helper
  const handleProductSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const res = await api.get<{ content: Product[] } | Product[]>(`/admin/products?search=${encodeURIComponent(query)}&size=10`);
      if (res) {
        if ('content' in res) {
          setSearchResults(res.content);
        } else {
          setSearchResults(Array.isArray(res) ? res : []);
        }
      }
    } catch {
      // Ignored
    } finally {
      setSearching(false);
    }
  };

  const addFeaturedProduct = (product: Product) => {
    if (featuredProducts.some((p) => p.id === product.id)) {
      toast.error('Product is already featured');
      return;
    }
    setFeaturedProducts([...featuredProducts, product]);
    setSearchQuery('');
    setSearchResults([]);
    toast.success(`${product.name} added to featured collection`);
  };

  const removeFeaturedProduct = (id: number) => {
    setFeaturedProducts(featuredProducts.filter((p) => p.id !== id));
  };

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const newProducts = [...featuredProducts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newProducts.length) return;

    // Swap
    const temp = newProducts[index];
    newProducts[index] = newProducts[targetIndex];
    newProducts[targetIndex] = temp;
    setFeaturedProducts(newProducts);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Sticky CTA Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-serif text-text-primary tracking-wide">Homepage Config</h1>
          <p className="text-xs text-text-secondary">
            Manage your store hero banner elements, CTA, and manually featured collections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-4 py-2 border border-border hover:bg-background rounded text-xs font-semibold uppercase tracking-wider text-text-primary transition-all"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-background border border-border hover:bg-surface disabled:opacity-50 rounded text-xs font-semibold uppercase tracking-wider text-text-primary transition-all"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Draft
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white hover:bg-accent/90 disabled:opacity-50 rounded text-xs font-semibold uppercase tracking-wider transition-all"
          >
            {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Publish Live
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: hero details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border p-6 rounded-md shadow-sm space-y-5">
            <h2 className="text-sm font-serif font-semibold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              Hero Section Settings
            </h2>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                Hero Title (supports new lines)
              </label>
              <textarea
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="Simplicity&#10;Defined by&#10;Elegance"
                rows={3}
                className="w-full text-xs bg-background border border-border px-3 py-2 rounded focus:outline-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                Hero Subtitle
              </label>
              <textarea
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="A curated capsule wardrobe constructed with soft beige palettes..."
                rows={3}
                className="w-full text-xs bg-background border border-border px-3 py-2 rounded focus:outline-accent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                  CTA Button Text
                </label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Shop the Collection"
                  className="w-full text-xs bg-background border border-border px-3 py-2 rounded focus:outline-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                  CTA Target Link
                </label>
                <input
                  type="text"
                  value={ctaLink}
                  onChange={(e) => setCtaLink(e.target.value)}
                  placeholder="/shop"
                  className="w-full text-xs bg-background border border-border px-3 py-2 rounded focus:outline-accent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider block">
                Hero Banner Image
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="Image URL"
                  className="flex-1 text-xs bg-background border border-border px-3 py-2 rounded focus:outline-accent"
                />
                <label className="flex items-center gap-1.5 px-3 py-2 bg-background border border-border hover:bg-surface rounded text-xs font-semibold cursor-pointer text-text-primary transition-all">
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              {heroImageUrl && (
                <div className="relative aspect-video max-w-md overflow-hidden rounded border border-border mt-2 bg-beige/10">
                  <img
                    src={heroImageUrl}
                    alt="Hero Banner preview"
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Featured curation */}
        <div className="space-y-6">
          <div className="bg-surface border border-border p-6 rounded-md shadow-sm space-y-5">
            <h2 className="text-sm font-serif font-semibold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
              Featured Products Curation
            </h2>

            {/* Product Picker */}
            <div className="space-y-2 relative">
              <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider block">
                Search & Add Products
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleProductSearch(e.target.value)}
                  placeholder="Type product name..."
                  className="w-full text-xs bg-background border border-border pl-8 pr-3 py-2 rounded focus:outline-accent"
                />
                {searching ? (
                  <Loader2 className="absolute left-2.5 top-2.5 h-3.5 w-3.5 animate-spin text-text-secondary" />
                ) : (
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-secondary" />
                )}
              </div>

              {/* Search Suggestions dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border rounded shadow-lg max-h-48 overflow-y-auto z-10 space-y-0.5 p-1">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addFeaturedProduct(product)}
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

            {/* Selected Curated List */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider block border-t border-border/40 pt-2.5">
                Curated Featured Products ({featuredProducts.length})
              </label>
              {featuredProducts.length === 0 ? (
                <p className="text-xs text-text-secondary italic text-center py-4 bg-background/50 rounded border border-dashed border-border/60">
                  No products selected. Fallback will omit featured products section.
                </p>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {featuredProducts.map((product, index) => (
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
                        <p className="text-[10px] text-text-secondary">
                          Rs. {product.minPrice ? product.minPrice.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveProduct(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-surface text-text-secondary hover:text-text-primary disabled:opacity-30 rounded transition-colors"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveProduct(index, 'down')}
                          disabled={index === featuredProducts.length - 1}
                          className="p-1 hover:bg-surface text-text-secondary hover:text-text-primary disabled:opacity-30 rounded transition-colors"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeFeaturedProduct(product.id)}
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
        </div>
      </div>
    </div>
  );
}
