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
        if (res?.metaTitle) {
          document.title = res.metaTitle;
        } else if (res?.title) {
          document.title = res.title.includes('Haus of Hafsah') ? res.title : `${res.title} — Haus of Hafsah`;
        } else {
          document.title = 'Privacy Policy | Haus of Hafsah';
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
          <div className="space-y-10 font-sans text-sm leading-relaxed text-brown-muted">
            <section className="space-y-4">
              <p>
                At <strong className="text-charcoal">Haus of Hafsah</strong>, we prioritize the confidentiality and protection of your personal information. This Privacy Policy details how we collect, store, utilize, and safeguard your data when you visit our website, place an order, or interact with our services within Pakistan.
              </p>
              <p>
                Our privacy framework complies with standard electronic data handling guidelines and digital commerce privacy regulations enforced in the Islamic Republic of Pakistan.
              </p>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                1. Information We Collect
              </h2>
              <p>
                To provide an efficient shopping and delivery experience, we collect information that identifies you or relates to your account:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-brown-muted">
                <li>
                  <strong className="text-charcoal">Contact Details:</strong> Your full name, email address, Pakistani phone number, and WhatsApp contact for order updates.
                </li>
                <li>
                  <strong className="text-charcoal">Delivery Address:</strong> Street address, city, province, and postal code within Pakistan to ensure accurate courier dispatch.
                </li>
                <li>
                  <strong className="text-charcoal">Order & Transaction Details:</strong> Products purchased, cart items, order history, discount codes used, and payment method selection (Cash on Delivery / SafePay online).
                </li>
                <li>
                  <strong className="text-charcoal">Technical Data:</strong> IP address, device type, browser specifications, and browsing session cookies for security and performance optimization.
                </li>
              </ul>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                2. How We Use Your Data
              </h2>
              <p>
                Your personal data is strictly utilized for core business operations:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-brown-muted">
                <li>Processing, packing, and fulfilling your orders through authorized logistics partners in Pakistan.</li>
                <li>Sending order confirmation SMS messages, email notifications, and dispatch tracking details.</li>
                <li>Verifying Cash on Delivery (COD) orders before courier dispatch.</li>
                <li>Providing responsive customer support and addressing inquiries or return/exchange requests.</li>
                <li>Improving website layout, product recommendations, and digital security.</li>
              </ul>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                3. Data Sharing & Third-Party Service Providers
              </h2>
              <p>
                We do <strong className="text-charcoal">not</strong> sell, rent, trade, or monetize your personal information to third parties for marketing purposes. Your information is shared exclusively with trusted service providers strictly to perform operational duties:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-brown-muted">
                <li>
                  <strong className="text-charcoal">Logistics & Courier Partners:</strong> Name, phone number, and delivery address are shared with reputable courier companies in Pakistan (e.g. TCS, CallCourier, Trax, Leopard) for doorstep delivery.
                </li>
                <li>
                  <strong className="text-charcoal">Payment Gateways:</strong> SafePay payment gateway infrastructure processes online card payments under bank-grade PCI-DSS compliance. We never store raw credit/debit card numbers on our servers.
                </li>
              </ul>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                4. Data Security & Storage
              </h2>
              <p>
                We employ SSL/TLS encryption, secure server architecture, and strict access controls to safeguard your data against unauthorized access, loss, or misuse. Account credentials and tokens are transmitted over encrypted HTTPS protocols.
              </p>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                5. Cookies & Local Storage
              </h2>
              <p>
                Our store utilizes essential cookies and browser local storage to maintain your active shopping bag, preserve login session tokens, and remember your site preferences. You may disable cookies in your browser settings, though certain checkout features may be affected.
              </p>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                6. Your Rights & Data Preferences
              </h2>
              <p>
                You have the right to access, update, or request the deletion of your personal account details stored with Haus of Hafsah at any time. You can manage your saved addresses in your account dashboard or email us to request account closure.
              </p>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                7. Contact Us
              </h2>
              <p>
                For questions or requests concerning this Privacy Policy, please contact our Privacy Data Officer at <a href="mailto:info@hausofhafsah.com" className="text-accent underline font-semibold">info@hausofhafsah.com</a>.
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
