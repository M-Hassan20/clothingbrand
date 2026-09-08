'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { getPageConfig, PageConfigDTO } from '@/lib/api/pages';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/image-loader';
import UrlSanitizer from '@/components/common/UrlSanitizer';

function AboutContent() {
  const searchParams = useSearchParams();
  const previewToken = searchParams.get('token') || undefined;

  const [config, setConfig] = useState<PageConfigDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await getPageConfig('ABOUT', previewToken);
        setConfig(res);
        if (res?.metaTitle) {
          document.title = res.metaTitle;
        } else if (res?.title) {
          document.title = res.title.includes('Haus of Hafsah') ? res.title : `${res.title} | Haus of Hafsah`;
        } else {
          document.title = 'About Us | Haus of Hafsah';
        }
      } catch (err) {
        console.error('Failed to load About page config:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [previewToken]);

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const title = config?.title || 'About Haus of Hafsah';
  const subtitle = config?.subtitle || 'Crafting a Legacy of Quiet Luxury';
  const bannerImage = config?.imageUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1600';
  const contentHtml = config?.contentHtml;

  return (
    <div className="w-full bg-background min-h-[calc(100vh-4rem)]">
      <UrlSanitizer paramKey="token" />
      {/* Styles for dynamic narrative body */}
      <style>{`
        .narrative-body h2 {
          font-size: 1.5rem;
          font-weight: 600;
          font-family: 'Playfair Display', Georgia, serif;
          color: #2B2622;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .narrative-body p {
          margin-bottom: 1.25rem;
          line-height: 1.8;
          color: #4A423A;
        }
        .narrative-body ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
          color: #4A423A;
        }
      `}</style>

      {/* Preview Banner */}
      {config?.isPreview && (
        <div className="w-full bg-accent/15 text-accent text-xs font-semibold px-4 py-3 text-center border-b border-accent/20 flex items-center justify-center gap-1.5 font-sans">
          <AlertCircle className="h-4 w-4" />
          <span>Preview Mode: You are viewing an unpublished draft of the About Us page.</span>
        </div>
      )}

      {/* Editorial Header */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center space-y-4 font-sans">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent">
          Our Heritage
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal tracking-wide max-w-2xl mx-auto leading-tight">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-brown-muted max-w-xl mx-auto leading-relaxed pt-2">
          {subtitle}
        </p>
      </section>

      {/* Editorial Banner Image */}
      {bannerImage && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-16 sm:mb-24">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-border/10">
            <Image
              src={getOptimizedImageUrl(bannerImage, 1600)}
              alt={title}
              fill
              sizes="100vw"
              priority
              className="object-cover object-center"
            />
          </div>
        </section>
      )}

      {/* Dynamic Narrative Content Body */}
      {contentHtml ? (
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-24 font-sans text-xs sm:text-sm text-brown-muted leading-relaxed narrative-body">
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </section>
      ) : (
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-24 grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 items-start font-sans text-xs sm:text-sm text-brown-muted leading-relaxed">
          <div className="space-y-6">
            <h2 className="font-serif text-xl sm:text-2xl text-charcoal tracking-wide font-normal">
              The Aesthetic Language
            </h2>
            <p>
              At Haus of Hafsah, we bypass transient trends to focus on core fabrication. Our design language is rooted in minimal, elegant touches. We favor a warm, tactile ivory and beige palette that feels inviting and soft, rather than stark and clinical.
            </p>
            <p>
              Each piece is custom-tailored with generous proportions, finished with subtle hairline seams, and structured using clean, premium fabrics like virgin wool, natural linen, and soft cashmere knits.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-serif text-xl sm:text-2xl text-charcoal tracking-wide font-normal">
              Conscious Craftsmanship
            </h2>
            <p>
              We believe that a boutique brand should prioritize sustainability and thoughtful production. We work closely with boutique mills that respect ecological limits and utilize ethical labour.
            </p>
            <p>
              By designing modular capsule collections, we help our clients construct long-term wardrobe systems. Every garment is engineered for modular styling, allowing you to combine outerwear, essentials, and knitwear into effortless seasonal edits.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <AboutContent />
    </Suspense>
  );
}
