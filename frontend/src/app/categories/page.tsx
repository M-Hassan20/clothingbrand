import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCategories } from '@/lib/api/categories';

export const revalidate = 3600;

export default async function CategoriesOverviewPage() {
  const categoriesList = await getCategories();

  const categoryImages: Record<string, string> = {
    'new-arrivals': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600',
    'knitwear': 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600',
    'outerwear': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600',
    'essentials': 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600',
  };

  return (
    <div className="w-full bg-background min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <span className="font-sans text-xs font-semibold uppercase tracking-widest text-accent">
            Curated Collections
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-charcoal tracking-wide">
            Browse Categories
          </h1>
          <p className="font-sans text-xs sm:text-sm text-brown-muted leading-relaxed">
            Discover modular basics, premium cashmere, and tailored outerwear structured for longevity and elegance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {categoriesList.map((cat) => {
            const imageSrc = categoryImages[cat.slug] || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600';
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-md bg-beige/20 border border-border/10 shadow-xs"
              >
                <Image
                  src={imageSrc}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {/* Overlay styling */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent flex flex-col justify-end p-6 text-background">
                  <span className="font-sans text-[10px] uppercase tracking-widest text-background/80">
                    {cat.slug.replace('-', ' ')}
                  </span>
                  <h2 className="font-serif text-lg font-medium tracking-wide mt-1">
                    {cat.name}
                  </h2>
                  {cat.description && (
                    <p className="font-sans text-[10px] text-background/70 mt-1 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
