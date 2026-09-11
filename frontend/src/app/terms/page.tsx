'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { getPageConfig, PageConfigDTO } from '@/lib/api/pages';
import { AlertCircle, Loader2 } from 'lucide-react';
import UrlSanitizer from '@/components/common/UrlSanitizer';

function TermsContent() {
  const [config, setConfig] = useState<PageConfigDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get('token') || undefined;
        const res = await getPageConfig('TERMS', token);
        setConfig(res);
        if (res?.metaTitle) {
          document.title = res.metaTitle;
        } else if (res?.title) {
          document.title = res.title.includes('Haus of Hafsah') ? res.title : `${res.title} — Haus of Hafsah`;
        } else {
          document.title = 'Terms & Conditions | Haus of Hafsah';
        }
      } catch (err) {
        console.error('Failed to load Terms config:', err);
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

  const title = config?.title || 'Terms & Conditions';
  const subtitle = config?.subtitle || 'Last Updated: August 15, 2026';
  const contentHtml = config?.contentHtml;

  return (
    <div className="bg-background text-charcoal min-h-screen py-16 px-6 sm:px-8 lg:px-12">
      <UrlSanitizer paramKey="token" />
      {/* Styles for embedded terms HTML */}
      <style>{`
        .terms-body h2 {
          font-size: 1.35rem;
          font-weight: 600;
          font-family: 'Playfair Display', Georgia, serif;
          color: #2B2622;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .terms-body p {
          margin-bottom: 1.25rem;
          line-height: 1.8;
          color: #4A423A;
        }
        .terms-body ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
          color: #4A423A;
        }
        .terms-body strong {
          color: #2B2622;
        }
      `}</style>

      {/* Preview Banner */}
      {config?.isPreview && (
        <div className="w-full bg-accent/15 text-accent text-xs font-semibold px-4 py-3 text-center border-b border-accent/20 flex items-center justify-center gap-1.5 font-sans mb-8">
          <AlertCircle className="h-4 w-4" />
          <span>Preview Mode: You are viewing an unpublished draft of Terms & Conditions.</span>
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
          <div className="terms-body font-sans text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        ) : (
          <div className="space-y-10 font-sans text-sm leading-relaxed text-brown-muted">
            <section className="space-y-4">
              <p>
                Welcome to <strong className="text-charcoal">Haus of Hafsah</strong>. By accessing or using our website, placing an order, or communicating with us, you agree to comply with and be bound by the following Terms & Conditions. Please read them carefully before making a purchase.
              </p>
              <p>
                These terms govern all commercial transactions, digital browsing, and order fulfillment services provided by Haus of Hafsah within the Islamic Republic of Pakistan under applicable commercial laws and the Electronic Transactions Ordinance 2002.
              </p>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                1. Domestic Delivery & Order Fulfillment
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-brown-muted">
                <li>
                  <strong className="text-charcoal">Delivery Scope:</strong> We currently fulfill orders exclusively within <strong className="text-charcoal">Pakistan</strong>. Any order requesting international delivery outside Pakistan cannot be processed at this time.
                </li>
                <li>
                  <strong className="text-charcoal">Delivery Timelines:</strong> Standard domestic delivery takes between <strong className="text-charcoal">3 to 7 business days</strong> depending on destination city and courier routing. Deliveries during festive sales or peak seasons (e.g. Eid, Black Friday) may experience slight delays.
                </li>
                <li>
                  <strong className="text-charcoal">Order Verification:</strong> Cash on Delivery (COD) orders require telephone or WhatsApp confirmation prior to dispatch. Haus of Hafsah reserves the right to cancel unverified orders.
                </li>
              </ul>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                2. Pricing & Currency
              </h2>
              <p>
                All product prices listed on our store are in <strong className="text-charcoal">Pakistani Rupees (PKR / Rs.)</strong> and are inclusive of applicable sales taxes where enforced by revenue authorities in Pakistan. Shipping fees are calculated and displayed at checkout. Prices are subject to change without prior notice.
              </p>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                3. Payment Options
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-brown-muted">
                <li>
                  <strong className="text-charcoal">Cash on Delivery (COD):</strong> Payment must be tendered in exact cash to the courier representative upon physical delivery of your shipment. Doorstep inspection is available where supported by domestic logistics partners.
                </li>
                <li>
                  <strong className="text-charcoal">Online Digital Payments (SafePay):</strong> Online card processing (Visa, Mastercard, UnionPay, Raast Instant Payment, and local mobile wallets) will be enabled shortly under PCI-DSS encrypted payment gateways.
                </li>
              </ul>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                4. Fabric Disclaimer & Color Accuracy
              </h2>
              <p>
                We strive to display product colors, embroidery details, and textures as accurately as possible. However, due to variations in monitor displays, smartphone color calibration, studio lighting, and manual dyeing processes, actual fabric shades may vary slightly from online representations.
              </p>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                5. Returns, Exchanges & Refunds
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-brown-muted">
                <li>
                  <strong className="text-charcoal">Eligibility:</strong> Items are eligible for exchange within <strong className="text-charcoal">7 days</strong> of delivery if delivered damaged, defective, or incorrect in size/style.
                </li>
                <li>
                  <strong className="text-charcoal">Condition:</strong> Returned garments must be unused, unwashed, unaltered, with original price tags and brand packaging intact.
                </li>
                <li>
                  <strong className="text-charcoal">Exclusions:</strong> Customized or stitched outfits and items purchased on final sale/clearance cannot be returned or exchanged unless a manufacturing defect is proven.
                </li>
              </ul>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                6. Intellectual Property Rights
              </h2>
              <p>
                All original content, apparel designs, collection titles, photographs, website logos, graphics, and underlying code are the exclusive intellectual property of Haus of Hafsah. Unauthorized reproduction, distribution, or commercial exploitation is strictly prohibited.
              </p>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                7. Governing Law & Dispute Resolution
              </h2>
              <p>
                These Terms & Conditions shall be governed by and construed in accordance with the laws of the <strong className="text-charcoal">Islamic Republic of Pakistan</strong>. Any disputes arising under or in connection with these terms shall be submitted to the exclusive jurisdiction of the competent courts in Pakistan.
              </p>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                8. Contact & Customer Care
              </h2>
              <p>
                If you have questions, feedback, or concerns regarding these Terms & Conditions, please contact our support team at <a href="mailto:info@hausofhafsah.com" className="text-accent underline font-semibold">info@hausofhafsah.com</a>.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <TermsContent />
    </Suspense>
  );
}
