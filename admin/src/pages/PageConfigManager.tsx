import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/error';
import {
  Upload,
  Loader2,
  Eye,
  Save,
  Send,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  Layout,
  FileText,
  Phone,
  ShieldCheck,
  FileCheck,
  Truck,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

export type PageKeyType = 'HOMEPAGE' | 'ABOUT' | 'CONTACT' | 'PRIVACY' | 'TERMS' | 'SHIPPING_RETURNS';

interface Product {
  id: number;
  name: string;
  brand?: string;
  minPrice?: number;
  thumbnailImage?: string;
}

interface PageConfigResponse {
  id: number;
  pageKey: PageKeyType;
  status: 'DRAFT' | 'PUBLISHED';
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  contentHtml?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  workingHours?: string;
  metaTitle?: string;
  metaDescription?: string;
  featuredProductIds?: number[];
  featuredProducts?: Product[];
  isPreview?: boolean;
}

const TAB_CONFIGS: { key: PageKeyType; label: string; icon: React.ReactNode; allowsImage: boolean; description: string }[] = [
  {
    key: 'HOMEPAGE',
    label: 'Homepage',
    icon: <Layout className="h-4 w-4" />,
    allowsImage: true,
    description: 'Configure hero banner title, subtitle, background image, CTA button, and curated products.',
  },
  {
    key: 'ABOUT',
    label: 'About Us',
    icon: <Info className="h-4 w-4" />,
    allowsImage: true,
    description: 'Manage brand story, craftsmanship narrative, and editorial hero banner image.',
  },
  {
    key: 'CONTACT',
    label: 'Contact Us',
    icon: <Phone className="h-4 w-4" />,
    allowsImage: false,
    description: 'Update header text, customer service email, phone, physical address, and hours.',
  },
  {
    key: 'PRIVACY',
    label: 'Privacy Policy',
    icon: <ShieldCheck className="h-4 w-4" />,
    allowsImage: false,
    description: 'Edit privacy policy title, last updated timestamp, and legal content sections.',
  },
  {
    key: 'TERMS',
    label: 'Terms of Service',
    icon: <FileCheck className="h-4 w-4" />,
    allowsImage: false,
    description: 'Manage storefront terms and conditions of service.',
  },
  {
    key: 'SHIPPING_RETURNS',
    label: 'Shipping & Returns',
    icon: <Truck className="h-4 w-4" />,
    allowsImage: false,
    description: 'Configure shipping rates, delivery timelines, replacement guidelines, and return policy text.',
  },
];

export default function PageConfigManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = (searchParams.get('tab')?.toUpperCase() as PageKeyType) || 'HOMEPAGE';

  const [activeTab, setActiveTab] = useState<PageKeyType>(
    TAB_CONFIGS.some((t) => t.key === activeTabParam) ? activeTabParam : 'HOMEPAGE'
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form Fields
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [contentHtml, setContentHtml] = useState('');

  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [workingHours, setWorkingHours] = useState('');

  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  // Product Search State for Homepage
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    document.title = 'Store Config & Page CMS — Haus of Hafsah Admin';
  }, []);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleTabChange = (key: PageKeyType) => {
    setActiveTab(key);
    setSearchParams({ tab: key.toLowerCase() });
  };

  useEffect(() => {
    fetchPageConfig(activeTab);
  }, [activeTab]);

  const fetchPageConfig = async (key: PageKeyType) => {
    try {
      setLoading(true);
      const res = await api.get<PageConfigResponse>(`/admin/page-config/${key}`);
      if (res) {
        setStatus(res.status || 'DRAFT');
        setTitle(res.title || '');
        setSubtitle(res.subtitle || '');
        setImageUrl(res.imageUrl || '');
        setCtaText(res.ctaText || '');
        setCtaLink(res.ctaLink || '');
        setContentHtml(res.contentHtml || '');
        setContactEmail(res.contactEmail || '');
        setContactPhone(res.contactPhone || '');
        setContactAddress(res.contactAddress || '');
        setWorkingHours(res.workingHours || '');
        setMetaTitle(res.metaTitle || '');
        setMetaDescription(res.metaDescription || '');
        setFeaturedProducts(res.featuredProducts || []);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const payload = {
        pageKey: activeTab,
        title,
        subtitle,
        imageUrl: currentTabConfig.allowsImage ? imageUrl : '',
        ctaText,
        ctaLink,
        contentHtml,
        contactEmail,
        contactPhone,
        contactAddress,
        workingHours,
        metaTitle,
        metaDescription,
        featuredProductIds: featuredProducts.map((p) => p.id),
      };
      const res = await api.put<PageConfigResponse>(`/admin/page-config/${activeTab}`, payload);
      setStatus(res.status);
      toast.success(`${currentTabConfig.label} draft saved successfully!`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      await handleSaveDraft();
      const res = await api.patch<PageConfigResponse>(`/admin/page-config/${activeTab}/publish`);
      setStatus(res.status);
      toast.success(`${currentTabConfig.label} page published live!`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPublishing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<{ fileUrl: string }>(`/admin/page-config/${activeTab}/image`, formData);
      setImageUrl(res.fileUrl);
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePreview = async () => {
    try {
      const res = await api.get<{ previewToken: string }>('/admin/page-config/preview-token');
      const routeMap: Record<PageKeyType, string> = {
        HOMEPAGE: '/',
        ABOUT: '/about',
        CONTACT: '/contact',
        PRIVACY: '/privacy',
        TERMS: '/terms',
        SHIPPING_RETURNS: '/shipping-returns',
      };
      const path = routeMap[activeTab] || '/';
      const previewUrl = `http://localhost:3000${path}?token=${res.previewToken}`;
      window.open(previewUrl, '_blank');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Product Search Handlers for Homepage tab
  const handleSearchProducts = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const res = await api.get<{ content: Product[] }>(`/admin/products?search=${encodeURIComponent(searchQuery)}&size=8`);
      setSearchResults(res.content || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  const addFeaturedProduct = (prod: Product) => {
    if (featuredProducts.some((p) => p.id === prod.id)) {
      toast.info('Product is already in featured list');
      return;
    }
    setFeaturedProducts((prev) => [...prev, prod]);
  };

  const removeFeaturedProduct = (id: number) => {
    setFeaturedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const newPos = direction === 'up' ? index - 1 : index + 1;
    if (newPos < 0 || newPos >= featuredProducts.length) return;
    const list = [...featuredProducts];
    const [moved] = list.splice(index, 1);
    list.splice(newPos, 0, moved);
    setFeaturedProducts(list);
  };

  const currentTabConfig = TAB_CONFIGS.find((t) => t.key === activeTab) || TAB_CONFIGS[0];

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal tracking-wide">
            Storefront & Page Configuration
          </h1>
          <p className="text-xs text-brown-muted mt-1">
            Customize headers, structured content, contact details, policies, and editorial banners across your storefront.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            className="px-3.5 py-2 text-xs font-semibold rounded border border-border/60 hover:bg-beige/20 text-charcoal flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>Preview Draft</span>
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={saving || loading}
            className="px-4 py-2 text-xs font-semibold rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save Draft</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={publishing || loading}
            className="px-4 py-2 text-xs font-semibold rounded bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>Publish Live</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/40 pb-2 scrollbar-none">
        {TAB_CONFIGS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t-md text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-accent bg-accent/10 text-charcoal'
                  : 'border-transparent text-brown-muted hover:text-charcoal hover:bg-beige/20'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Info Banner */}
      <div className="bg-beige/10 border border-border/40 p-4 rounded-md flex items-start justify-between gap-4 text-xs">
        <div>
          <div className="flex items-center gap-2 font-bold text-charcoal">
            <span>{currentTabConfig.label} Configuration</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {status}
            </span>
          </div>
          <p className="text-brown-muted mt-1">{currentTabConfig.description}</p>
        </div>
        {!currentTabConfig.allowsImage && (
          <span className="text-[10px] bg-beige/40 border border-border/40 px-2 py-1 rounded text-brown-muted font-medium shrink-0">
            Text Only Mode
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Title & Subtitle */}
          <div className="bg-white border border-border/60 rounded-md p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-sm font-semibold text-charcoal border-b border-border/40 pb-2">
              Header & Metadata Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Page Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Quiet Luxury Clothing & Accessories"
                  className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Page Subtitle / Tagline</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Crafted for modular elegance and longevity"
                  className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">SEO Title (Browser Tab)</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="e.g. About Us | Haus of Hafsah"
                  className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">SEO Meta Description</label>
                <input
                  type="text"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="e.g. Discover our boutique heritage and craftsmanship..."
                  className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Banner Image Upload (Allowed for Homepage and About Us) */}
          {currentTabConfig.allowsImage && (
            <div className="bg-white border border-border/60 rounded-md p-6 space-y-4 shadow-xs">
              <h3 className="font-serif text-sm font-semibold text-charcoal border-b border-border/40 pb-2 flex items-center justify-between">
                <span>Editorial Banner Image</span>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer font-sans"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove Image</span>
                  </button>
                )}
              </h3>

              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Interactive Clickable Image Box */}
                <div
                  onClick={triggerFileSelect}
                  className="relative aspect-[16/9] w-full sm:w-80 rounded-md border-2 border-dashed border-border/80 hover:border-accent/80 bg-beige/10 hover:bg-accent/5 flex flex-col items-center justify-center p-4 cursor-pointer transition-all group shrink-0 overflow-hidden"
                >
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} alt="Banner Preview" className="w-full h-full object-cover rounded" />
                      <div className="absolute inset-0 bg-charcoal/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5">
                        <Upload className="h-4 w-4" />
                        <span>Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-2 py-4 flex flex-col items-center justify-center">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 text-accent text-xs font-semibold group-hover:bg-accent/25 transition-colors">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Select Image</span>
                      </div>
                      <p className="text-[10px] text-brown-muted">JPG, PNG, WebP up to 5MB</p>
                    </div>
                  )}
                </div>

                {/* Description & Explicit Upload Action Button */}
                <div className="space-y-4 flex-1">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-charcoal">Select Image File</h4>
                    <p className="text-xs text-brown-muted leading-relaxed">
                      Upload a high-resolution banner image to be displayed at the top of your page. Recommended aspect ratio 16:9 (e.g. 1600x900px).
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={triggerFileSelect}
                      disabled={uploading}
                      className="px-4 py-2.5 bg-accent text-background hover:bg-accent/90 text-xs font-semibold rounded-md shadow-xs flex items-center gap-2 cursor-pointer transition-all duration-150 disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Uploading Image...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>Choose & Upload Image</span>
                        </>
                      )}
                    </button>

                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="px-3 py-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md border border-rose-200 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {imageUrl && (
                    <div className="p-2.5 rounded bg-beige/20 border border-border/40 text-[10px] text-brown-muted font-mono break-all space-y-0.5">
                      <span className="font-bold text-charcoal block">Current Image URL:</span>
                      <span>{imageUrl}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contact Specific Structured Text Fields */}
          {activeTab === 'CONTACT' && (
            <div className="bg-white border border-border/60 rounded-md p-6 space-y-4 shadow-xs">
              <h3 className="font-serif text-sm font-semibold text-charcoal border-b border-border/40 pb-2">
                Contact Details & Operations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Customer Support Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="info@hausofhafsah.com"
                    className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Phone / WhatsApp Line</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+92 314 8730683"
                    className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Physical Store Address</label>
                  <input
                    type="text"
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    placeholder="Block 4, Clifton, Karachi, Pakistan"
                    className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Working Hours</label>
                  <input
                    type="text"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="Monday – Saturday: 10:00 AM – 8:00 PM PKT"
                    className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Homepage Specific Fields (CTA & Curated Products) */}
          {activeTab === 'HOMEPAGE' && (
            <>
              <div className="bg-white border border-border/60 rounded-md p-6 space-y-4 shadow-xs">
                <h3 className="font-serif text-sm font-semibold text-charcoal border-b border-border/40 pb-2">
                  Call To Action (CTA)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="e.g. Explore Collection"
                      className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">CTA Link Path</label>
                    <input
                      type="text"
                      value={ctaLink}
                      onChange={(e) => setCtaLink(e.target.value)}
                      placeholder="e.g. /shop"
                      className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Featured Products Curation */}
              <div className="bg-white border border-border/60 rounded-md p-6 space-y-4 shadow-xs">
                <h3 className="font-serif text-sm font-semibold text-charcoal border-b border-border/40 pb-2">
                  Curated Featured Products
                </h3>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products by title or brand..."
                      className="flex-1 px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                    />
                    <button
                      onClick={handleSearchProducts}
                      disabled={searching}
                      className="px-4 py-2 bg-charcoal text-white hover:bg-charcoal/90 text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer"
                    >
                      {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      <span>Search</span>
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="border border-border/40 rounded p-2 bg-beige/10 space-y-1 max-h-48 overflow-y-auto">
                      <span className="text-[10px] font-bold text-brown-muted uppercase tracking-wider block px-2">
                        Search Results:
                      </span>
                      {searchResults.map((prod) => (
                        <div key={prod.id} className="flex items-center justify-between p-2 hover:bg-white rounded text-xs">
                          <span className="font-medium text-charcoal">{prod.name} ({prod.brand || 'Boutique'})</span>
                          <button
                            onClick={() => addFeaturedProduct(prod)}
                            className="px-2.5 py-1 bg-accent text-white text-[10px] font-semibold rounded flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" /> Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Products List */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-charcoal">Selected Featured List (Ordered):</span>
                  {featuredProducts.length === 0 ? (
                    <p className="text-xs text-brown-muted italic">No products curated yet.</p>
                  ) : (
                    <div className="divide-y divide-border/40 border border-border/40 rounded bg-white">
                      {featuredProducts.map((prod, idx) => (
                        <div key={prod.id} className="p-3 flex items-center justify-between gap-4 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-brown-muted text-xs">#{idx + 1}</span>
                            <span className="font-semibold text-charcoal">{prod.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveProduct(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 hover:bg-beige/20 rounded disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => moveProduct(idx, 'down')}
                              disabled={idx === featuredProducts.length - 1}
                              className="p-1 hover:bg-beige/20 rounded disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => removeFeaturedProduct(prod.id)}
                              className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer ml-2"
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
            </>
          )}

          {/* Text / HTML Body Editor */}
          <div className="bg-white border border-border/60 rounded-md p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-sm font-semibold text-charcoal border-b border-border/40 pb-2">
              Body & Narrative HTML Content
            </h3>
            <p className="text-xs text-brown-muted">
              Use clean structured HTML tags (`&lt;h2&gt;`, `&lt;p&gt;`, `&lt;ul&gt;`, `&lt;blockquote&gt;`) to structure narrative body text.
            </p>
            <textarea
              rows={12}
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
              placeholder="<h2>1. Section Title</h2><p>Narrative content goes here...</p>"
              className="w-full px-3 py-2 text-xs font-mono border border-border/60 rounded focus:outline-none focus:border-accent leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
}
