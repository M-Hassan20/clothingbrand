'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

export interface CarouselSlideDTO {
  id?: number;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  linkType?: 'PRODUCT' | 'CATEGORY' | 'CUSTOM' | 'NONE';
  targetId?: number;
  customUrl?: string;
  displayOrder?: number;
  resolvedProduct?: {
    id: number;
    name: string;
    slug?: string;
  };
  resolvedCategory?: {
    id: number;
    name: string;
  };
}

interface HeroCarouselProps {
  slides: CarouselSlideDTO[];
  intervalSeconds?: number;
}

export default function HeroCarousel({ slides, intervalSeconds = 5 }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (totalSlides <= 1 || isHovered) return;
    const duration = Math.max(2, intervalSeconds) * 1000;
    const timer = setInterval(() => {
      nextSlide();
    }, duration);
    return () => clearInterval(timer);
  }, [totalSlides, intervalSeconds, isHovered, nextSlide]);

  if (!slides || slides.length === 0) return null;

  const getSlideHref = (slide: CarouselSlideDTO): string => {
    if (slide.linkType === 'PRODUCT' && slide.resolvedProduct) {
      return `/products/${slide.resolvedProduct.slug || slide.resolvedProduct.id}`;
    }
    if (slide.linkType === 'CATEGORY' && slide.resolvedCategory) {
      return `/shop?category=${encodeURIComponent(slide.resolvedCategory.name)}`;
    }
    if (slide.linkType === 'CUSTOM' && slide.customUrl) {
      return slide.customUrl;
    }
    return '/shop';
  };

  return (
    <section
      className="relative w-full h-[82vh] min-h-[580px] max-h-[850px] overflow-hidden bg-neutral-950 text-white select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Homepage Featured Carousel"
    >
      {/* Slide Stack */}
      {slides.map((slide, idx) => {
        const isActive = idx === currentIndex;
        const href = getSlideHref(slide);

        return (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full">
              <Image
                src={slide.imageUrl}
                alt={slide.title || `Featured slide ${idx + 1}`}
                fill
                priority={idx === 0}
                className="object-cover object-center transform scale-105 transition-transform duration-10000 ease-out"
                sizes="100vw"
              />
              {/* Luxury Ambient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-neutral-950/30" />
            </div>

            {/* Slide Content Overlay */}
            <div className="relative max-w-7xl mx-auto h-full px-6 sm:px-12 flex flex-col justify-end pb-24 sm:pb-32">
              <div
                className={`max-w-2xl transform transition-all duration-700 delay-300 ${
                  isActive ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
              >
                {slide.title && (
                  <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif tracking-tight leading-[1.1] mb-4 text-white drop-shadow-md">
                    {slide.title}
                  </h1>
                )}
                {slide.subtitle && (
                  <p className="text-base sm:text-xl font-light text-neutral-200 leading-relaxed mb-8 max-w-xl line-clamp-3">
                    {slide.subtitle}
                  </p>
                )}
                {slide.linkType !== 'NONE' && (
                  <Link
                    href={href}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-white text-neutral-900 font-medium text-sm uppercase tracking-widest rounded-none shadow-xl hover:bg-amber-100 transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <span>{slide.ctaText || 'Discover Collection'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Slide Navigation Arrows */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 text-white rounded-full hover:bg-white hover:text-black transition-all duration-300 opacity-80 hover:opacity-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 text-white rounded-full hover:bg-white hover:text-black transition-all duration-300 opacity-80 hover:opacity-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicator Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
