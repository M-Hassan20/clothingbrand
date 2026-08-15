'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
  defaultImage: string | null;
  variantImages: string[];
}

export default function ProductGallery({ defaultImage, variantImages }: ProductGalleryProps) {
  // Aggregate unique images
  const allImages = Array.from(
    new Set([defaultImage, ...variantImages].filter((img): img is string => !!img))
  );

  const [activeIndex, setActiveIndex] = useState(0);

  // If the component receives new images (e.g. loading completes), reset index
  useEffect(() => {
    setActiveIndex(0);
  }, [defaultImage]);

  if (allImages.length === 0) {
    return (
      <div className="aspect-[3/4] w-full rounded-md bg-beige/40 flex items-center justify-center text-brown-muted font-serif text-sm">
        Haus of Hafsah
      </div>
    );
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Large Main Display */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-beige/35 border border-border/10">
        <Image
          src={allImages[activeIndex]}
          alt="Product details view"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center transition-opacity duration-300"
        />

        {/* Gallery Controls (Visible if more than 1 image) */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 shadow-md text-charcoal hover:bg-background transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous image</span>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 shadow-md text-charcoal hover:bg-background transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next image</span>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails strip */}
      {allImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent">
          {allImages.map((img, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={img}
                onClick={() => setActiveIndex(idx)}
                className={`relative aspect-[3/4] w-16 sm:w-20 overflow-hidden rounded-md bg-beige/20 border transition-all shrink-0 ${
                  isSelected ? 'border-accent ring-1 ring-accent' : 'border-border hover:border-charcoal/40'
                }`}
              >
                <Image
                  src={img}
                  alt={`Product view thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover object-center"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
