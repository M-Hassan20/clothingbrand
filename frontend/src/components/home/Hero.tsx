import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
}

export default function Hero({ title, subtitle, imageUrl, ctaText, ctaLink }: HeroProps) {
  const displaySubtitle = subtitle || "A curated capsule wardrobe constructed with soft beige palettes, luxurious cashmere knits, and editorial outerwear silhouettes designed for modern living.";
  const displayImage = imageUrl || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1200";
  const displayCtaText = ctaText || "Shop the Collection";
  const displayCtaLink = ctaLink || "/shop";

  return (
    <section className="relative w-full border-b border-border bg-beige/10">
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-4rem)]">
        {/* Left: Image (stacked on top for mobile) */}
        <div className="relative w-full h-[50vh] md:h-auto overflow-hidden">
          <Image
            src={displayImage}
            alt="Haus of Hafsah seasonal editorial model"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
          />
        </div>

        {/* Right: Content (stacked below for mobile) */}
        <div className="flex flex-col justify-center px-6 py-12 md:py-24 md:px-16 lg:px-20 space-y-6 md:space-y-8">
          <div className="space-y-3">
            <span className="font-sans text-xs font-semibold uppercase tracking-widest text-accent">
              Autumn-Winter Edition
            </span>
            {title ? (
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-tight text-charcoal tracking-tight" style={{ whiteSpace: 'pre-line' }}>
                {title}
              </h1>
            ) : (
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-tight text-charcoal tracking-tight">
                Simplicity <br />
                Defined by <br />
                <span className="italic">Elegance</span>
              </h1>
            )}
          </div>
          
          <p className="font-sans text-sm sm:text-base leading-relaxed text-brown-muted max-w-md">
            {displaySubtitle}
          </p>

          <div>
            <Link href={displayCtaLink} passHref>
              <Button className="bg-accent text-background hover:bg-accent/90 px-8 py-3 rounded-md font-sans text-sm font-semibold flex items-center gap-2 group shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
                {displayCtaText}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
