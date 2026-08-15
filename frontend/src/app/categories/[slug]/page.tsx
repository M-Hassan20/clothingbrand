import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategories } from '@/lib/api/categories';
import { getProductsByCategory } from '@/lib/api/products';
import ProductGrid from '@/components/product/ProductGrid';
import { ArrowLeft } from 'lucide-react';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Fetch all categories to find the match by slug
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  // Fetch products under this category
  const products = await getProductsByCategory(category.id);

  return (
    <div className="w-full bg-background min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-sans text-brown-muted hover:text-charcoal transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Catalog
          </Link>
        </div>

        {/* Category Header */}
        <div className="space-y-2 border-b border-border/40 pb-6">
          <h1 className="font-serif text-3xl sm:text-4xl text-charcoal tracking-wide capitalize">
            {category.name}
          </h1>
          {category.description && (
            <p className="font-sans text-xs sm:text-sm text-brown-muted max-w-2xl">
              {category.description}
            </p>
          )}
        </div>

        {/* Products Grid */}
        <div>
          <ProductGrid products={products} loading={false} />
        </div>
      </div>
    </div>
  );
}
