'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { getPageConfig, PageConfigDTO } from '@/lib/api/pages';
import { AlertCircle, Loader2, Truck, RefreshCw, ShieldCheck, Clock } from 'lucide-react';
import UrlSanitizer from '@/components/common/UrlSanitizer';

function ShippingReturnsContent() {
  const [config, setConfig] = useState<PageConfigDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get('token') || undefined;
        const res = await getPageConfig('SHIPPING_RETURNS', token);
        setConfig(res);
        if (res?.metaTitle) {
          document.title = res.metaTitle;
        } else if (res?.title) {
          document.title = res.title.includes('Haus of Hafsah') ? res.title : `${res.title} — Haus of Hafsah`;
        } else {
          document.title = 'Shipping & Returns Policy | Haus of Hafsah';
        }
      } catch (err) {
        console.error('Failed to load Shipping & Returns config:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const title = config?.title || 'Shipping & Returns Policy';
  const subtitle = config?.subtitle || 'Delivery timelines, shipping fees, doorstep inspection, and return guidelines.';
  const contentHtml = config?.contentHtml;

  return (
    <div className="bg-background text-charcoal min-h-screen py-16 px-6 sm:px-8 lg:px-12">
      <UrlSanitizer paramKey="token" />
      {/* Embedded styles for policy HTML */}
      <style>{`
        .shipping-body h2 {
          font-size: 1.35rem;
          font-weight: 600;
          font-family: 'Playfair Display', Georgia, serif;
          color: #2B2622;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .shipping-body p {
          margin-bottom: 1.25rem;
          line-height: 1.8;
          color: #4A423A;
        }
        .shipping-body ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
          color: #4A423A;
        }
        .shipping-body strong {
          color: #2B2622;
        }
      `}</style>

      {/* Preview Banner */}
      {config?.isPreview && (
        <div className="w-full bg-accent/15 text-accent text-xs font-semibold px-4 py-3 text-center border-b border-accent/20 flex items-center justify-center gap-1.5 font-sans mb-8">
          <AlertCircle className="h-4 w-4" />
          <span>Preview Mode: You are viewing an unpublished draft of Shipping & Returns Policy.</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto font-sans">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-brown-muted mb-8">
          <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
          <span>/</span>
          <span className="text-charcoal font-semibold">{title}</span>
        </nav>

        {/* Heading */}
        <div className="border-b border-border/60 pb-10 mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-wide mb-4">
            {title}
          </h1>
          <p className="text-xs text-brown-muted">
            {subtitle}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-5 rounded-md border border-border/40 bg-beige/10 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Truck className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-serif text-sm font-semibold text-charcoal">Nationwide Shipping</h3>
            <p className="text-xs text-brown-muted leading-relaxed">
              Fast delivery across Pakistan via PostEx Services Private Limited.
            </p>
          </div>

          <div className="p-5 rounded-md border border-border/40 bg-beige/10 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-serif text-sm font-semibold text-charcoal">2–5 Business Days</h3>
            <p className="text-xs text-brown-muted leading-relaxed">
              Standard delivery timeline for major metro regions including Karachi, Lahore, and Islamabad.
            </p>
          </div>

          <div className="p-5 rounded-md border border-border/40 bg-beige/10 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
              <RefreshCw className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-serif text-sm font-semibold text-charcoal">7-Day Replacement</h3>
            <p className="text-xs text-brown-muted leading-relaxed">
              Hassle-free size exchanges and returns for unworn and unused items with original tags attached.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        {contentHtml ? (
          <div className="shipping-body text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        ) : (
          <div className="space-y-10 text-sm leading-relaxed text-brown-muted">
            <section className="space-y-4">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                Nationwide Shipping Policy
              </h2>
              <p>
                We deliver nationwide across Pakistan using PostEx Services Private Limited. Standard delivery timelines range between 2 to 5 business days for major metro regions including Karachi, Lahore, and Islamabad.
              </p>
              <p>
                <strong className="text-charcoal">Note:</strong> We currently ship within Pakistan. Delivery to international destinations will be made available as announced.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                Returns, Exchanges & Refunds
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-charcoal">Return Window:</strong> Eligible items may be returned or exchanged within 7 days of delivery.</li>
                <li><strong className="text-charcoal">Eligibility Criteria:</strong> Items must be unworn, unwashed, unaltered, undamaged, and returned with original tags and packaging.</li>
                <li><strong className="text-charcoal">Non-Returnable Items:</strong> Customized/tailored items, clearance/sale items, and hygienic/innerwear items are final sale.</li>
                <li><strong className="text-charcoal">Return Shipping:</strong> Customers are responsible for sending return items back to our warehouse unless the return is due to a wrong or defective item sent by us.</li>
                <li><strong className="text-charcoal">Refunds:</strong> Approved refunds for pre-paid orders will be processed via original payment method or store credit within 7–14 business days. COD refunds will be issued via Bank Transfer or JazzCash/EasyPaisa upon inspection of returned items.</li>
              </ul>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                Customer Assistance
              </h2>
              <p>
                For further clarification regarding your shipment status or return tracking, please reach out to our concierge desk at <a href="mailto:info@hausofhafsah.com" className="text-accent underline font-semibold">info@hausofhafsah.com</a>.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShippingReturnsPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <ShippingReturnsContent />
    </Suspense>
  );
}
