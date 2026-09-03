import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/error';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
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
  Phone,
  ShieldCheck,
  FileCheck,
  Truck,
  Info,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Code,
  Layers,
  Sliders,
  Link as LinkIcon,
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

interface CategoryOption {
  id: number;
  name: string;
}

export interface CarouselSlide {
  id?: number;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  linkType: 'PRODUCT' | 'CATEGORY' | 'CUSTOM' | 'NONE';
  targetId?: number;
  customUrl?: string;
  displayOrder?: number;
  resolvedProduct?: Product;
  resolvedCategory?: CategoryOption;
}

interface PageConfigResponse {
  id: number;
  pageKey: PageKeyType;
  status: 'DRAFT' | 'PUBLISHED';
  heroType?: 'SPLIT' | 'CAROUSEL';
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  carouselIntervalSeconds?: number;
  slides?: CarouselSlide[];
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
    description: 'Configure Split Hero or Carousel Hero, custom slides, featured products, and metadata.',
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
  const slideFileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

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
  const [heroType, setHeroType] = useState<'SPLIT' | 'CAROUSEL'>('SPLIT');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaLink, setCtaLink] = useState('');

  // Carousel specific state
  const [carouselIntervalSeconds, setCarouselIntervalSeconds] = useState<number>(5);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [contentHtml, setContentHtml] = useState('');
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'html'>('wysiwyg');

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setContentHtml(editor.getHTML());
    },
  });

  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [workingHours, setWorkingHours] = useState('');

  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  // Product Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  // Slide Product Search State
  const [activeSlideSearchIndex, setActiveSlideSearchIndex] = useState<number | null>(null);
  const [slideSearchQuery, setSlideSearchQuery] = useState('');
  const [slideSearchResults, setSlideSearchResults] = useState<Product[]>([]);

  useEffect(() => {
    document.title = 'Store Config & Page CMS — Haus of Hafsah Admin';
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get<CategoryOption[]>('/categories');
      setCategories(res || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

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
        setHeroType(res.heroType || 'SPLIT');
        setTitle(res.title || '');
        setSubtitle(res.subtitle || '');
        setImageUrl(res.imageUrl || '');
        setCtaText(res.ctaText || '');
        setCtaLink(res.ctaLink || '');
        setCarouselIntervalSeconds(res.carouselIntervalSeconds || 5);
        setSlides(res.slides || []);

        const html = res.contentHtml || '';
        setContentHtml(html);
        if (editor) {
          editor.commands.setContent(html);
        }
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
        heroType,
        title,
        subtitle,
        imageUrl: currentTabConfig.allowsImage ? imageUrl : '',
        ctaText,
        ctaLink,
        carouselIntervalSeconds,
        slides: slides.map((s, index) => ({
          ...s,
          displayOrder: index,
        })),
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

  const handleSlideImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<{ fileUrl: string }>(`/admin/page-config/HOMEPAGE/image`, formData);
      setSlides((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], imageUrl: res.fileUrl };
        return copy;
      });
      toast.success(`Slide ${index + 1} image uploaded successfully`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
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

  // Carousel Slide Helpers
  const addSlide = () => {
    setSlides((prev) => [
      ...prev,
      {
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200',
        title: 'New Editorial Banner',
        subtitle: 'Curated luxury collection silhouettes.',
        ctaText: 'Explore Collection',
        linkType: 'NONE',
        displayOrder: prev.length,
      },
    ]);
  };

  const removeSlide = (index: number) => {
    setSlides((prev) => prev.filter((_, i) => i !== index));
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    const copy = [...slides];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setSlides(copy);
  };

  const updateSlideField = (index: number, field: keyof CarouselSlide, value: any) => {
    setSlides((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
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

  const [slideSearching, setSlideSearching] = useState(false);

  const fetchSlideProducts = async (query: string = '') => {
    try {
      setSlideSearching(true);
      const res = await api.get<{ content: Product[] }>(`/admin/products?search=${encodeURIComponent(query)}&size=10`);
      setSlideSearchResults(res.content || []);
    } catch (err) {
      console.error('Failed to search slide products:', err);
    } finally {
      setSlideSearching(false);
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
      {/* Hidden File Input for Main Banner */}
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
            Customize hero banners, split vs. carousel layouts, dynamic slides, page narrative text, policies, and curated products.
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
          {/* Hero Style Selector (Homepage Only) */}
          {activeTab === 'HOMEPAGE' && (
            <div className="bg-white border border-border/60 rounded-md p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <h3 className="font-serif text-sm font-semibold text-charcoal flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-accent" />
                    <span>Hero Section Style</span>
                  </h3>
                  <p className="text-[11px] text-brown-muted mt-0.5">
                    Select hero layout format. Swappable anytime; settings for both styles are preserved.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setHeroType('SPLIT')}
                  className={`p-4 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    heroType === 'SPLIT'
                      ? 'border-accent bg-accent/5 ring-2 ring-accent/30'
                      : 'border-border/60 hover:border-accent/40 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-xs text-charcoal flex items-center gap-1.5">
                        <Layout className="h-4 w-4" />
                        <span>Split Hero Style</span>
                      </span>
                      {heroType === 'SPLIT' && (
                        <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded font-bold uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-brown-muted">
                      Classic 2-column layout with high-impact imagery on left and editorial typography on right.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setHeroType('CAROUSEL')}
                  className={`p-4 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    heroType === 'CAROUSEL'
                      ? 'border-accent bg-accent/5 ring-2 ring-accent/30'
                      : 'border-border/60 hover:border-accent/40 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-xs text-charcoal flex items-center gap-1.5">
                        <Layers className="h-4 w-4" />
                        <span>Carousel Hero Style</span>
                      </span>
                      {heroType === 'CAROUSEL' && (
                        <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded font-bold uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-brown-muted">
                      Auto-playing multi-slide banner with custom imagery, title overlays, and linked products or collections.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Carousel Slide Builder (When HeroType === CAROUSEL and activeTab === HOMEPAGE) */}
          {activeTab === 'HOMEPAGE' && heroType === 'CAROUSEL' && (
            <div className="bg-white border border-border/60 rounded-md p-6 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <h3 className="font-serif text-sm font-semibold text-charcoal flex items-center gap-2">
                    <Layers className="h-4 w-4 text-amber-600" />
                    <span>Carousel Slides Configuration</span>
                  </h3>
                  <p className="text-[11px] text-brown-muted mt-0.5">
                    Add, reorder, and configure individual banner slides with custom images and links.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-charcoal whitespace-nowrap">
                      Auto-Play Interval:
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={30}
                      value={carouselIntervalSeconds}
                      onChange={(e) => setCarouselIntervalSeconds(parseInt(e.target.value) || 5)}
                      className="w-16 px-2 py-1 text-xs border border-border/60 rounded text-center focus:outline-none focus:border-accent"
                    />
                    <span className="text-xs text-brown-muted">sec</span>
                  </div>

                  <button
                    type="button"
                    onClick={addSlide}
                    className="px-3 py-1.5 text-xs font-semibold rounded bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Slide</span>
                  </button>
                </div>
              </div>

              {slides.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border/60 rounded-lg">
                  <Layers className="h-8 w-8 mx-auto text-brown-muted/50 mb-2" />
                  <p className="text-xs font-medium text-charcoal">No slides configured yet.</p>
                  <p className="text-[11px] text-brown-muted mt-1">Click "Add Slide" above to build your first carousel slide.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {slides.map((slide, index) => (
                    <div
                      key={index}
                      className="border border-border/60 rounded-lg p-5 bg-beige/5 space-y-4 relative"
                    >
                      <div className="flex items-center justify-between border-b border-border/40 pb-3">
                        <span className="text-xs font-bold text-charcoal flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px]">
                            {index + 1}
                          </span>
                          <span>Slide #{index + 1}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => moveSlide(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-brown-muted hover:text-charcoal disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSlide(index, 'down')}
                            disabled={index === slides.length - 1}
                            className="p-1 text-brown-muted hover:text-charcoal disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSlide(index)}
                            className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
                            title="Remove Slide"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Slide Image Preview & Upload */}
                        <div>
                          <label className="block text-xs font-semibold text-charcoal mb-1">Slide Image</label>
                          <div className="relative w-full h-36 bg-white border border-border/60 rounded-md overflow-hidden flex flex-col items-center justify-center group mb-2">
                            {slide.imageUrl ? (
                              <img
                                src={slide.imageUrl}
                                alt={`Slide ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-brown-muted">No Image Selected</span>
                            )}
                          </div>

                          <input
                            type="file"
                            accept="image/*"
                            ref={(el) => (slideFileInputRefs.current[index] = el)}
                            onChange={(e) => handleSlideImageUpload(index, e)}
                            className="hidden"
                          />

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => slideFileInputRefs.current[index]?.click()}
                              className="px-3 py-1.5 text-xs font-semibold rounded bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-1.5 cursor-pointer shadow-xs w-full justify-center"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              <span>Choose Slide Image</span>
                            </button>
                          </div>
                        </div>

                        {/* Slide Overlay Text Fields */}
                        <div className="md:col-span-2 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-charcoal mb-1">Title (Optional)</label>
                              <input
                                type="text"
                                value={slide.title || ''}
                                onChange={(e) => updateSlideField(index, 'title', e.target.value)}
                                placeholder="e.g. Silk Capsule Wardrobe"
                                className="w-full px-3 py-1.5 text-xs border border-border/60 rounded focus:outline-none focus:border-accent bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-charcoal mb-1">CTA Button Text</label>
                              <input
                                type="text"
                                value={slide.ctaText || ''}
                                onChange={(e) => updateSlideField(index, 'ctaText', e.target.value)}
                                placeholder="e.g. Discover Collection"
                                className="w-full px-3 py-1.5 text-xs border border-border/60 rounded focus:outline-none focus:border-accent bg-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-charcoal mb-1">Subtitle (Optional)</label>
                            <input
                              type="text"
                              value={slide.subtitle || ''}
                              onChange={(e) => updateSlideField(index, 'subtitle', e.target.value)}
                              placeholder="e.g. Meticulously tailored silk blouses and refined trousers."
                              className="w-full px-3 py-1.5 text-xs border border-border/60 rounded focus:outline-none focus:border-accent bg-white"
                            />
                          </div>

                          {/* Link Target Selector */}
                          <div className="border-t border-border/40 pt-3">
                            <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1">
                              <LinkIcon className="h-3.5 w-3.5 text-accent" />
                              <span>Click Link Target</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <select
                                value={slide.linkType || 'NONE'}
                                onChange={(e) => updateSlideField(index, 'linkType', e.target.value as any)}
                                className="w-full px-3 py-1.5 text-xs border border-border/60 rounded focus:outline-none focus:border-accent bg-white"
                              >
                                <option value="NONE">No Action Link</option>
                                <option value="PRODUCT">Link to Specific Product</option>
                                <option value="CATEGORY">Link to Store Category</option>
                                <option value="CUSTOM">Custom URL Path</option>
                              </select>

                              {/* Target Specific Input */}
                              {slide.linkType === 'CATEGORY' && (
                                <select
                                  value={slide.targetId || ''}
                                  onChange={(e) => updateSlideField(index, 'targetId', parseInt(e.target.value))}
                                  className="w-full px-3 py-1.5 text-xs border border-border/60 rounded focus:outline-none focus:border-accent bg-white"
                                >
                                  <option value="">Select Category...</option>
                                  {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {slide.linkType === 'CUSTOM' && (
                                <input
                                  type="text"
                                  value={slide.customUrl || ''}
                                  onChange={(e) => updateSlideField(index, 'customUrl', e.target.value)}
                                  placeholder="e.g. /shop?collection=autumn"
                                  className="w-full px-3 py-1.5 text-xs border border-border/60 rounded focus:outline-none focus:border-accent bg-white"
                                />
                              )}

                              {slide.linkType === 'PRODUCT' && (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextIndex = activeSlideSearchIndex === index ? null : index;
                                      setActiveSlideSearchIndex(nextIndex);
                                      if (nextIndex !== null) {
                                        fetchSlideProducts(slideSearchQuery);
                                      }
                                    }}
                                    className="w-full px-3 py-1.5 text-xs border border-border/60 rounded text-left flex items-center justify-between bg-white text-charcoal shadow-xs hover:border-accent transition-colors"
                                  >
                                    <span className="truncate">
                                      {slide.resolvedProduct ? (
                                        <span className="font-semibold text-charcoal">{slide.resolvedProduct.name} (#{slide.resolvedProduct.id})</span>
                                      ) : slide.targetId ? (
                                        <span>Target Product ID: #{slide.targetId}</span>
                                      ) : (
                                        <span className="text-brown-muted italic">Click to search and select product...</span>
                                      )}
                                    </span>
                                    <Search className="h-3.5 w-3.5 text-accent shrink-0" />
                                  </button>

                                  {activeSlideSearchIndex === index && (
                                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-border/60 rounded-md shadow-xl p-2.5 space-y-2">
                                      <div className="flex items-center gap-1">
                                        <div className="relative flex-1">
                                          <Search className="absolute left-2.5 top-2 h-3 w-3 text-brown-muted" />
                                          <input
                                            type="text"
                                            autoFocus
                                            value={slideSearchQuery}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setSlideSearchQuery(val);
                                              fetchSlideProducts(val);
                                            }}
                                            placeholder="Type product name..."
                                            className="w-full pl-7 pr-2 py-1.5 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                                          />
                                        </div>
                                        {slideSearching && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                                      </div>

                                      <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-border/20">
                                        {slideSearchResults.length === 0 ? (
                                          <div className="py-3 text-center text-xs text-brown-muted italic">
                                            {slideSearching ? 'Searching products...' : 'No matching products found.'}
                                          </div>
                                        ) : (
                                          slideSearchResults.map((prod) => (
                                            <div
                                              key={prod.id}
                                              onClick={() => {
                                                updateSlideField(index, 'targetId', prod.id);
                                                updateSlideField(index, 'resolvedProduct', prod);
                                                setActiveSlideSearchIndex(null);
                                              }}
                                              className="flex items-center gap-2 p-1.5 hover:bg-accent/10 rounded cursor-pointer transition-colors pt-1.5"
                                            >
                                              {prod.thumbnailImage ? (
                                                <img src={prod.thumbnailImage} alt={prod.name} className="w-6 h-6 object-cover rounded shrink-0" />
                                              ) : (
                                                <div className="w-6 h-6 bg-beige/30 rounded flex items-center justify-center text-[9px] text-brown-muted shrink-0">
                                                  Img
                                                </div>
                                              )}
                                              <div className="truncate text-xs flex-1">
                                                <p className="font-semibold text-charcoal truncate">{prod.name}</p>
                                                <p className="text-[10px] text-brown-muted">ID: #{prod.id}</p>
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Main Title & Subtitle for Split Hero / Narrative Pages */}
          {(activeTab !== 'HOMEPAGE' || heroType === 'SPLIT') && (
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

                {currentTabConfig.allowsImage && (
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">CTA Link Path</label>
                    <input
                      type="text"
                      value={ctaLink}
                      onChange={(e) => setCtaLink(e.target.value)}
                      placeholder="/shop"
                      className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Page Subtitle / Tagline</label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Editorial subtitle displayed below the main heading..."
                  className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                />
              </div>

              {currentTabConfig.allowsImage && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="Shop the Collection"
                      className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">Hero Banner Image</label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-12 bg-beige/20 border border-border/60 rounded overflow-hidden shrink-0">
                        {imageUrl ? (
                          <img src={imageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-brown-muted flex items-center justify-center h-full">None</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={triggerFileSelect}
                        disabled={uploading}
                        className="px-3 py-2 text-xs font-semibold rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        <span>Choose & Upload Image</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Narrative Content TipTap Editor (For Text Pages: About, Contact, Privacy, Terms, Shipping) */}
          {activeTab !== 'HOMEPAGE' && (
            <div className="bg-white border border-border/60 rounded-md p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <h3 className="font-serif text-sm font-semibold text-charcoal">
                  Body Narrative Content (WYSIWYG & HTML)
                </h3>
                <div className="flex items-center gap-1 bg-beige/20 p-1 rounded border border-border/40">
                  <button
                    type="button"
                    onClick={() => setEditorMode('wysiwyg')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                      editorMode === 'wysiwyg' ? 'bg-white text-charcoal shadow-xs' : 'text-brown-muted hover:text-charcoal'
                    }`}
                  >
                    WYSIWYG Visual
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('html')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors flex items-center gap-1 ${
                      editorMode === 'html' ? 'bg-white text-charcoal shadow-xs' : 'text-brown-muted hover:text-charcoal'
                    }`}
                  >
                    <Code className="h-3 w-3" />
                    <span>HTML Code</span>
                  </button>
                </div>
              </div>

              {editorMode === 'wysiwyg' && editor ? (
                <div className="border border-border/60 rounded-md overflow-hidden bg-white">
                  {/* TipTap Formatting Toolbar */}
                  <div className="flex items-center gap-1 p-2 bg-beige/10 border-b border-border/40 flex-wrap">
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`p-1.5 rounded hover:bg-beige/40 ${editor.isActive('bold') ? 'bg-accent/20 text-accent' : 'text-charcoal'}`}
                      title="Bold"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`p-1.5 rounded hover:bg-beige/40 ${editor.isActive('italic') ? 'bg-accent/20 text-accent' : 'text-charcoal'}`}
                      title="Italic"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </button>

                    <div className="w-px h-4 bg-border/60 mx-1" />

                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`p-1.5 rounded hover:bg-beige/40 ${editor.isActive('heading', { level: 2 }) ? 'bg-accent/20 text-accent' : 'text-charcoal'}`}
                      title="Heading 2"
                    >
                      <Heading2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`p-1.5 rounded hover:bg-beige/40 ${editor.isActive('heading', { level: 3 }) ? 'bg-accent/20 text-accent' : 'text-charcoal'}`}
                      title="Heading 3"
                    >
                      <Heading3 className="h-3.5 w-3.5" />
                    </button>

                    <div className="w-px h-4 bg-border/60 mx-1" />

                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={`p-1.5 rounded hover:bg-beige/40 ${editor.isActive('bulletList') ? 'bg-accent/20 text-accent' : 'text-charcoal'}`}
                      title="Bullet List"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={`p-1.5 rounded hover:bg-beige/40 ${editor.isActive('orderedList') ? 'bg-accent/20 text-accent' : 'text-charcoal'}`}
                      title="Numbered List"
                    >
                      <ListOrdered className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBlockquote().run()}
                      className={`p-1.5 rounded hover:bg-beige/40 ${editor.isActive('blockquote') ? 'bg-accent/20 text-accent' : 'text-charcoal'}`}
                      title="Quote"
                    >
                      <Quote className="h-3.5 w-3.5" />
                    </button>

                    <div className="w-px h-4 bg-border/60 mx-1" />

                    <button
                      type="button"
                      onClick={() => editor.chain().focus().undo().run()}
                      className="p-1.5 rounded hover:bg-beige/40 text-charcoal"
                      title="Undo"
                    >
                      <Undo className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().redo().run()}
                      className="p-1.5 rounded hover:bg-beige/40 text-charcoal"
                      title="Redo"
                    >
                      <Redo className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <EditorContent editor={editor} className="p-4 min-h-[220px] text-xs font-sans prose prose-sm focus:outline-none" />
                </div>
              ) : (
                <div>
                  <textarea
                    rows={10}
                    value={contentHtml}
                    onChange={(e) => {
                      setContentHtml(e.target.value);
                      if (editor) editor.commands.setContent(e.target.value);
                    }}
                    placeholder="Enter raw HTML content..."
                    className="w-full px-3 py-2 text-xs font-mono border border-border/60 rounded focus:outline-none focus:border-accent bg-neutral-900 text-neutral-100"
                  />
                </div>
              )}
            </div>
          )}

          {/* Contact Details (Contact Us Tab Only) */}
          {activeTab === 'CONTACT' && (
            <div className="bg-white border border-border/60 rounded-md p-6 space-y-4 shadow-xs">
              <h3 className="font-serif text-sm font-semibold text-charcoal border-b border-border/40 pb-2">
                Customer Service Contact Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Customer Support Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="support@hausofhafsah.com"
                    className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Boutique Phone Line</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Physical Flagship Address</label>
                  <input
                    type="text"
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    placeholder="Gulberg III, Lahore, Pakistan"
                    className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Working Hours</label>
                  <input
                    type="text"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="Mon – Sat: 10:00 AM – 8:00 PM PKT"
                    className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Featured Products Picker (Homepage Tab Only) */}
          {activeTab === 'HOMEPAGE' && (
            <div className="bg-white border border-border/60 rounded-md p-6 space-y-4 shadow-xs">
              <h3 className="font-serif text-sm font-semibold text-charcoal border-b border-border/40 pb-2">
                Curated Featured Products Section
              </h3>
              <p className="text-xs text-brown-muted">
                Search and select products to highlight on your homepage. Order can be arranged using up/down controls.
              </p>

              {/* Product Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-brown-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchProducts()}
                    placeholder="Search by product name or brand..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearchProducts}
                  disabled={searching}
                  className="px-4 py-2 text-xs font-semibold rounded bg-accent text-white hover:bg-accent/90 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  <span>Search</span>
                </button>
              </div>

              {/* Search Results Dropdown/Grid */}
              {searchResults.length > 0 && (
                <div className="bg-beige/10 border border-border/60 p-3 rounded-md space-y-2 max-h-48 overflow-y-auto">
                  <span className="text-[11px] font-bold text-charcoal uppercase tracking-wider block">
                    Search Results (Click to Add):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResults.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => addFeaturedProduct(prod)}
                        className="flex items-center gap-2 p-2 bg-white border border-border/40 rounded hover:border-accent cursor-pointer transition-colors"
                      >
                        {prod.thumbnailImage ? (
                          <img src={prod.thumbnailImage} alt={prod.name} className="w-8 h-8 object-cover rounded" />
                        ) : (
                          <div className="w-8 h-8 bg-beige/30 rounded flex items-center justify-center text-[10px] text-brown-muted">
                            No Img
                          </div>
                        )}
                        <div className="truncate text-xs">
                          <p className="font-semibold text-charcoal truncate">{prod.name}</p>
                          <p className="text-[10px] text-brown-muted">PKR {prod.minPrice || 0}</p>
                        </div>
                        <Plus className="h-4 w-4 text-accent ml-auto shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Featured Products List */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-charcoal block">
                  Curated Products Sequence ({featuredProducts.length}):
                </span>
                {featuredProducts.length === 0 ? (
                  <p className="text-xs text-brown-muted italic bg-beige/10 p-4 rounded text-center">
                    No products added yet. Use the search bar above to curate products for your homepage.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {featuredProducts.map((prod, index) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between p-3 bg-beige/10 border border-border/40 rounded text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-brown-muted text-xs w-4">{index + 1}.</span>
                          {prod.thumbnailImage ? (
                            <img src={prod.thumbnailImage} alt={prod.name} className="w-8 h-8 object-cover rounded" />
                          ) : (
                            <div className="w-8 h-8 bg-beige/30 rounded flex items-center justify-center text-[10px]">
                              No Img
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-charcoal">{prod.name}</p>
                            <p className="text-[10px] text-brown-muted">ID: #{prod.id}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveProduct(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-brown-muted hover:text-charcoal disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveProduct(index, 'down')}
                            disabled={index === featuredProducts.length - 1}
                            className="p-1 text-brown-muted hover:text-charcoal disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFeaturedProduct(prod.id)}
                            className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEO & Meta Details */}
          <div className="bg-white border border-border/60 rounded-md p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-sm font-semibold text-charcoal border-b border-border/40 pb-2">
              SEO & Search Engine Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">SEO Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="e.g. Haus of Hafsah | Official Luxury Store"
                  className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">SEO Meta Description</label>
                <input
                  type="text"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Meta description for search engine result snippets..."
                  className="w-full px-3 py-2 text-xs border border-border/60 rounded focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
