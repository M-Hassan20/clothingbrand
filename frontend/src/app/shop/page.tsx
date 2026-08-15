'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, ArrowUpDown, X, Loader2 } from 'lucide-react';
import { getCategories } from '@/lib/api/categories';
import { getBrands, filterProducts, FilterParams } from '@/lib/api/products';
import { CategoryResponse, ProductResponse } from '@/types/api';
import ProductGrid from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Wrap the actual shop content in a Suspense component because useSearchParams requires client-side hydration
export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <span className="text-xs text-brown-muted">Loading Shop...</span>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Categories & Brands list
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  
  // Filter States
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Read initial query params
  const paramCategoryId = searchParams.get('categoryId');
  const paramBrand = searchParams.get('brand');
  const paramSearch = searchParams.get('search') || '';

  const [selectedCat, setSelectedCat] = useState<number | null>(
    paramCategoryId ? parseInt(paramCategoryId) : null
  );
  const [selectedBrand, setSelectedBrand] = useState<string | null>(paramBrand || null);
  const [searchQuery, setSearchQuery] = useState<string>(paramSearch);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  
  // Sorting
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');

  // Load static filter parameters (Categories and Brands)
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [catList, brandList] = await Promise.all([getCategories(), getBrands()]);
        setCategories(catList);
        setBrands(brandList);
      } catch (err) {
        console.error('Error loading shop filters:', err);
      }
    };
    loadFiltersData();
  }, []);

  // Sync state if query params change externally
  useEffect(() => {
    setSelectedCat(paramCategoryId ? parseInt(paramCategoryId) : null);
    setSelectedBrand(paramBrand || null);
    setSearchQuery(paramSearch);
  }, [paramCategoryId, paramBrand, paramSearch]);

  // Fetch filtered products
  useEffect(() => {
    const fetchFiltered = async () => {
      try {
        setLoading(true);
        const params: FilterParams = {
          sortBy,
          sortDir: sortDir as 'ASC' | 'DESC',
        };
        if (selectedCat) params.categoryId = selectedCat;
        if (selectedBrand) params.brand = selectedBrand;
        if (searchQuery) params.search = searchQuery;
        if (minPrice !== '') params.minPrice = Number(minPrice);
        if (maxPrice !== '') params.maxPrice = Number(maxPrice);

        const filteredList = await filterProducts(params);
        setProducts(filteredList);
      } catch (err) {
        console.error('Error loading filtered products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFiltered();
  }, [selectedCat, selectedBrand, searchQuery, minPrice, maxPrice, sortBy, sortDir]);

  const handleResetFilters = () => {
    setSelectedCat(null);
    setSelectedBrand(null);
    setMinPrice('');
    setMaxPrice('');
    setSearchQuery('');
    setSortBy('createdAt');
    setSortDir('DESC');
    router.push('/shop');
  };

  const getSortLabel = () => {
    if (sortBy === 'price' && sortDir === 'ASC') return 'Price: Low to High';
    if (sortBy === 'price' && sortDir === 'DESC') return 'Price: High to Low';
    return 'Newest Arrivals';
  };

  const renderFiltersContent = () => (
    <div className="space-y-8 pr-2">
      {/* Search Filter display if set */}
      {searchQuery && (
        <div className="flex items-center justify-between bg-beige/30 p-2.5 rounded-md border border-border/30">
          <span className="font-sans text-xs text-charcoal">
            Searching for: <strong className="italic">&quot;{searchQuery}&quot;</strong>
          </span>
          <button
            onClick={() => {
              setSearchQuery('');
              const params = new URLSearchParams(searchParams.toString());
              params.delete('search');
              router.push(`/shop?${params.toString()}`);
            }}
            className="text-brown-muted hover:text-charcoal"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Category Section */}
      <div>
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-charcoal mb-4">
          Categories
        </h3>
        <div className="flex flex-col space-y-2.5">
          <button
            onClick={() => setSelectedCat(null)}
            className={`text-left font-sans text-xs transition-colors py-1 ${
              selectedCat === null
                ? 'text-accent font-semibold'
                : 'text-brown-muted hover:text-charcoal'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`text-left font-sans text-xs transition-colors py-1 ${
                selectedCat === cat.id
                  ? 'text-accent font-semibold'
                  : 'text-brown-muted hover:text-charcoal'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Section */}
      <div>
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-charcoal mb-4">
          Brands
        </h3>
        <div className="flex flex-col space-y-2.5">
          <button
            onClick={() => setSelectedBrand(null)}
            className={`text-left font-sans text-xs transition-colors py-1 ${
              selectedBrand === null
                ? 'text-accent font-semibold'
                : 'text-brown-muted hover:text-charcoal'
            }`}
          >
            All Brands
          </button>
          {brands.map((brandName) => (
            <button
              key={brandName}
              onClick={() => setSelectedBrand(brandName)}
              className={`text-left font-sans text-xs transition-colors py-1 ${
                selectedBrand?.toLowerCase() === brandName.toLowerCase()
                  ? 'text-accent font-semibold'
                  : 'text-brown-muted hover:text-charcoal'
              }`}
            >
              {brandName}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-charcoal mb-4">
          Price Range
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-charcoal placeholder-brown-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <span className="text-xs text-brown-muted font-sans">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-charcoal placeholder-brown-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Clear Filters Button */}
      {(selectedCat !== null || selectedBrand !== null || minPrice !== '' || maxPrice !== '' || searchQuery !== '') && (
        <Button
          onClick={() => {
            handleResetFilters();
            setMobileFiltersOpen(false);
          }}
          variant="outline"
          className="w-full border-error text-error hover:bg-error/5 py-2.5 rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          Reset Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="w-full mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Title Header */}
      <div className="border-b border-border/40 pb-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl text-charcoal tracking-wide">
            {selectedCat ? categories.find((c) => c.id === selectedCat)?.name : 'Shop All Collections'}
          </h1>
          <p className="font-sans text-xs text-brown-muted">
            Browsing {products.length} {products.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Mobile Filter Trigger Sheet */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger render={
              <Button
                variant="outline"
                className="lg:hidden border-border text-charcoal hover:bg-blush/20 text-xs font-semibold py-2 px-3 rounded-md flex items-center gap-1.5"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
            } />
            <SheetContent side="bottom" className="h-[80vh] bg-background p-6 rounded-t-xl border-t border-border overflow-y-auto">
              <SheetHeader className="text-left mb-6">
                <SheetTitle className="font-serif text-xl text-charcoal">Filter Catalog</SheetTitle>
                <SheetDescription>Refine product lists matching selections</SheetDescription>
              </SheetHeader>
              {renderFiltersContent()}
            </SheetContent>
          </Sheet>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button
                variant="outline"
                className="border-border text-charcoal hover:bg-blush/20 text-xs font-semibold py-2 px-3 rounded-md flex items-center gap-1.5"
              >
                <ArrowUpDown className="h-4 w-4" />
                {getSortLabel()}
              </Button>
            } />
            <DropdownMenuContent align="end" className="bg-background border border-border shadow-md">
              <DropdownMenuItem
                onClick={() => { setSortBy('createdAt'); setSortDir('DESC'); }}
                className="font-sans text-xs text-brown-muted hover:text-charcoal hover:bg-beige/40 cursor-pointer"
              >
                Newest Arrivals
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setSortBy('price'); setSortDir('ASC'); }}
                className="font-sans text-xs text-brown-muted hover:text-charcoal hover:bg-beige/40 cursor-pointer"
              >
                Price: Low to High
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setSortBy('price'); setSortDir('DESC'); }}
                className="font-sans text-xs text-brown-muted hover:text-charcoal hover:bg-beige/40 cursor-pointer"
              >
                Price: High to Low
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-4 items-start">
        {/* Left Sticky Sidebar: Desktop Filters */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-24 self-start max-h-[80vh] overflow-y-auto pr-4 scrollbar-thin">
          {renderFiltersContent()}
        </aside>

        {/* Right Grid Content */}
        <div className="lg:col-span-3">
          <ProductGrid products={products} loading={loading} />
        </div>
      </div>
    </div>
  );
}
