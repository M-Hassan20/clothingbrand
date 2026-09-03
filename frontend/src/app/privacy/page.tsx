'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { getPageConfig, PageConfigDTO } from '@/lib/api/pages';
import { AlertCircle, Loader2 } from 'lucide-react';
import UrlSanitizer from '@/components/common/UrlSanitizer';

function PrivacyContent() {
  const [config, setConfig] = useState<PageConfigDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get('token') || undefined;
        const res = await getPageConfig('PRIVACY', token);
        setConfig(res);
        if (res?.metaTitle || res?.title) {
          document.title = `${res.metaTitle || res.title} — Haus of Hafsah`;
        } else {
          document.title = 'Privacy Policy — Haus of Hafsah';
        }
      } catch (err) {
        console.error('Failed to load Privacy Policy config:', err);
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

  const title = config?.title || 'Privacy Policy';
  const subtitle = config?.subtitle || 'Last Updated: August 15, 2026';
  const contentHtml = config?.contentHtml;

  return (
    <div className="bg-background text-charcoal min-h-screen py-16 px-6 sm:px-8 lg:px-12">
      <UrlSanitizer paramKey="token" />
      {/* Styles for embedded policy HTML */}
      <style>{`
        .policy-body h2 {
          font-size: 1.35rem;
          font-weight: 600;
          font-family: 'Playfair Display', Georgia, serif;
          color: #2B2622;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .policy-body p {
          margin-bottom: 1.25rem;
          line-height: 1.8;
          color: #4A423A;
        }
        .policy-body ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
          color: #4A423A;
        }
        .policy-body strong {
          color: #2B2622;
        }
      `}</style>

      {/* Preview Banner */}
      {config?.isPreview && (
        <div className="w-full bg-accent/15 text-accent text-xs font-semibold px-4 py-3 text-center border-b border-accent/20 flex items-center justify-center gap-1.5 font-sans mb-8">
          <AlertCircle className="h-4 w-4" />
          <span>Preview Mode: You are viewing an unpublished draft of the Privacy Policy.</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-brown-muted mb-8 font-sans">
          <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
          <span>/</span>
          <span className="text-charcoal font-semibold">{title}</span>
        </nav>

        {/* Heading */}
        <div className="border-b border-border/60 pb-10 mb-12 font-sans">
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-wide mb-4">
            {title}
          </h1>
          <p className="text-xs text-brown-muted">
            {subtitle}
          </p>
        </div>

        {/* Content Sections */}
        {contentHtml ? (
          <div className="policy-body font-sans text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        ) : (
          <div className="space-y-12 font-sans text-sm leading-relaxed text-brown-muted">
            <section className="space-y-4">
              <p>
                At <strong className="text-charcoal">Haus of Hafsah</strong>, we appreciate the trust you place in us. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy details how we collect, use, disclose, and safeguard your data when you visit our website, place an order, or engage with our services.
              </p>
              <p>
                This policy complies with standard electronic transaction laws and personal data protection regulations applicable to digital e-commerce operations in Pakistan.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                1. Information We Collect
              </h2>
              <p>
                To fulfill your orders, deliver premium products, and provide a seamless shopping experience, we collect your full name, email address, shipping address, phone number, and payment preferences.
              </p>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                2. Contact Us
              </h2>
              <p>
                For questions regarding our privacy policy, please reach out to us at: <a href="mailto:info@hausofhafsah.com" className="text-accent underline">info@hausofhafsah.com</a>.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <PrivacyContent />
    </Suspense>
  );
}
