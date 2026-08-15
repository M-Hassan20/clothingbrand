import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface CategoryTile {
  id: number;
  name: string;
  tagline: string;
  image: string;
  href: string;
}

export default function CategoryTiles() {
  const categories: CategoryTile[] = [
    {
      id: 2,
      name: 'Knitwear Collection',
      tagline: 'Cashmere & ribbed edits',
      image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600',
      href: '/shop?categoryId=2',
    },
    {
      id: 3,
      name: 'Tailored Outerwear',
      tagline: 'Timeless trench & wool wraps',
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600',
      href: '/shop?categoryId=3',
    },
    {
      id: 4,
      name: 'Modern Essentials',
      tagline: 'Elevated everyday staples',
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600',
      href: '/shop?categoryId=4',
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="text-center max-w-xl mx-auto space-y-2 mb-12">
        <h2 className="font-serif text-2xl sm:text-3xl text-charcoal tracking-wide">
          Curated Categories
        </h2>
        <p className="font-sans text-xs text-brown-muted">
          Timeless fabrics structured for longevity, simplicity, and premium aesthetic.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className="group relative block aspect-[3/4] overflow-hidden rounded-md bg-beige/20 border border-border/10 shadow-xs"
          >
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Overlay styling */}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent flex flex-col justify-end p-6 text-background">
              <span className="font-sans text-[10px] uppercase tracking-widest text-background/80">
                {cat.tagline}
              </span>
              <h3 className="font-serif text-lg font-medium tracking-wide mt-1">
                {cat.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
