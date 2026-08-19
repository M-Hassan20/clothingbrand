import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductResponse } from '@/types/api';
import ProductCard from '@/components/product/ProductCard';

interface FeaturedProductsProps {
  newArrivals: ProductResponse[];
  bestSellers: ProductResponse[];
  featuredProducts?: ProductResponse[];
}

export default function FeaturedProducts({ newArrivals, bestSellers, featuredProducts }: FeaturedProductsProps) {
  return (
    <>
      {/* Featured Collection (Manually Curated) */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="flex items-end justify-between mb-10">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl sm:text-3xl text-charcoal tracking-wide">
                Featured Collection
              </h2>
              <p className="font-sans text-xs text-brown-muted">
                Handpicked editorial pieces chosen by our style curators.
              </p>
            </div>
            <Link href="/shop" className="font-sans text-xs text-accent hover:underline font-semibold flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4 snap-x md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-x-visible md:pb-0 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent">
            {featuredProducts.map((product) => (
              <div key={product.id} className="w-[80vw] shrink-0 snap-align-start md:w-auto">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="bg-beige/10 border-y border-border/40 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl sm:text-3xl text-charcoal tracking-wide">
                New Arrivals
              </h2>
              <p className="font-sans text-xs text-brown-muted">
                Our latest design additions for this season.
              </p>
            </div>
            <Link href="/shop" className="font-sans text-xs text-accent hover:underline font-semibold flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Grid Layout (scrollable on mobile) */}
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x md:grid md:grid-cols-3 md:overflow-x-visible md:pb-0 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent">
            {newArrivals.slice(0, 3).map((product) => (
              <div key={product.id} className="w-[80vw] shrink-0 snap-align-start md:w-auto">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex items-end justify-between mb-10">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl sm:text-3xl text-charcoal tracking-wide">
              Best Sellers
            </h2>
            <p className="font-sans text-xs text-brown-muted">
              Most loved pieces from the Haus collections.
            </p>
          </div>
          <Link href="/shop" className="font-sans text-xs text-accent hover:underline font-semibold flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 snap-x md:grid md:grid-cols-3 md:overflow-x-visible md:pb-0 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent">
          {bestSellers.slice(0, 3).map((product) => (
            <div key={product.id} className="w-[80vw] shrink-0 snap-align-start md:w-auto">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
