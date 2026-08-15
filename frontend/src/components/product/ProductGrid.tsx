'use client';

import React from 'react';
import ProductCard from './ProductCard';
import { ProductResponse } from '@/types/api';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag } from 'lucide-react';

interface ProductGridProps {
  products: ProductResponse[];
  loading: boolean;
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex flex-col space-y-3">
            {/* Card Skeleton aspect-[3/4] */}
            <Skeleton className="aspect-[3/4] w-full rounded-md bg-beige/25" />
            {/* Brand Skeleton */}
            <Skeleton className="h-3 w-16 bg-beige/25" />
            {/* Title Skeleton */}
            <Skeleton className="h-4 w-3/4 bg-beige/25" />
            {/* Price Skeleton */}
            <Skeleton className="h-3.5 w-1/4 bg-beige/25" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-beige/10 rounded-md border border-dashed border-border/50">
        <div className="rounded-full bg-beige/35 p-4 text-brown-muted">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <div className="space-y-1 max-w-[280px]">
          <h3 className="font-serif text-lg font-medium text-charcoal">No products found</h3>
          <p className="font-sans text-xs text-brown-muted">
            We couldn&apos;t find any items matching your selected filters. Try resetting them or exploring other options.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-10 md:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
