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

  const title = config?.title || 'Terms of Service';
  const subtitle = config?.subtitle || 'Last Updated: September 11, 2026';
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
          <span>Preview Mode: You are viewing an unpublished draft of Terms of Service.</span>
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
            {/* 1. ACCEPTANCE OF TERMS */}
            <section className="space-y-4">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                1. Acceptance of Terms
              </h2>
              <p>
                These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Haus of Hafsah website and related services (the &quot;Service&quot;), operated by Haus of Hafsah (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By accessing or using the Service, whether as a registered customer or as a guest, you agree to be bound by these Terms. If you do not agree, please do not use the Service.
              </p>
            </section>

            {/* 2. ELIGIBILITY */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                2. Eligibility
              </h2>
              <p>
                You must be at least 18 years of age, or the age of legal majority in your jurisdiction, to make a purchase through the Service. By placing an order, you represent that you meet this requirement.
              </p>
            </section>

            {/* 3. ACCOUNTS AND GUEST CHECKOUT */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                3. Accounts and Guest Checkout
              </h2>
              <div className="space-y-3">
                <p>
                  <strong className="text-charcoal">3.1 Accounts:</strong> You may create an account using an email address and password, or by signing in with Google. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.
                </p>
                <p>
                  <strong className="text-charcoal">3.2 Guest Checkout:</strong> You may also place an order without creating a full account (&quot;Guest Checkout&quot;). By doing so, you agree to provide accurate name, contact, and shipping information. A basic customer profile is created and associated with your email address to process your order and to recognize you should you check out again using the same email in future, without any password being set on your behalf.
                </p>
                <p>
                  <strong className="text-charcoal">3.3 Accuracy of Information:</strong> You agree to provide accurate, current, and complete information when creating an account, checking out as a guest, or otherwise interacting with the Service, and to keep such information up to date.
                </p>
              </div>
            </section>

            {/* 4. PRODUCTS, PRICING, AND AVAILABILITY */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                4. Products, Pricing, and Availability
              </h2>
              <div className="space-y-3">
                <p>
                  <strong className="text-charcoal">4.1 Product Descriptions:</strong> We make reasonable efforts to accurately describe and display our products, including through images and written descriptions. Colors and details may vary slightly due to display settings, photography, and manufacturing variation, particularly for handcrafted or limited items.
                </p>
                <p>
                  <strong className="text-charcoal">4.2 Pricing:</strong> All prices are listed in Pakistani Rupees (PKR) unless otherwise stated, and are subject to change without prior notice. The price applicable to your order is the price displayed at the time you complete checkout.
                </p>
                <p>
                  <strong className="text-charcoal">4.3 Availability:</strong> All orders are subject to product availability. In the event that an item you have ordered is unavailable, we will notify you and either offer a substitute, delay, or full refund of the amount paid for that item, at our discretion and in accordance with applicable consumer protection law.
                </p>
                <p>
                  <strong className="text-charcoal">4.4 Errors:</strong> We reserve the right to correct any errors, inaccuracies, or omissions, including after an order has been submitted, and to cancel any order affected by such an error, in which case any payment made will be refunded.
                </p>
              </div>
            </section>

            {/* 5. ORDERS AND PAYMENT */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                5. Orders and Payment
              </h2>
              <div className="space-y-3">
                <p>
                  <strong className="text-charcoal">5.1 Order Acceptance:</strong> Your order constitutes an offer to purchase. We reserve the right to accept or decline any order for any reason, including suspected fraud, pricing errors, or unavailability of stock.
                </p>
                <p>
                  <strong className="text-charcoal">5.2 Payment Methods:</strong> We accept payment via our third-party payment processor (SafePay), which supports credit/debit cards, digital wallets, and Raast instant payments, as well as Cash on Delivery (&quot;COD&quot;) where available. By choosing an online payment method, you also agree to the applicable terms of our payment processor.
                </p>
                <p>
                  <strong className="text-charcoal">5.3 Cash on Delivery:</strong> Where Cash on Delivery is offered, payment is due in full to our delivery partner at the time of delivery. We reserve the right to restrict or withdraw the availability of COD for certain orders, customers, or regions.
                </p>
              </div>
            </section>

            {/* 6. SHIPPING AND DELIVERY */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                6. Shipping and Delivery
              </h2>
              <div className="space-y-3">
                <p>
                  <strong className="text-charcoal">6.1 Processing & Timelines:</strong> We aim to process and dispatch orders within 1-2 business days of order confirmation. Delivery timeframes provided at checkout are estimates only and are not guaranteed.
                </p>
                <p>
                  <strong className="text-charcoal">6.2 Risk of Loss:</strong> Risk of loss and title for products purchased passes to you upon delivery to the shipping address provided.
                </p>
                <p>
                  <strong className="text-charcoal">6.3 Address Accuracy:</strong> It is your responsibility to ensure that the shipping address and contact details provided are accurate and complete. We are not responsible for delays or non-delivery caused by incorrect or incomplete information provided by you.
                </p>
              </div>
            </section>

            {/* 7. RETURNS, EXCHANGES, AND REFUNDS */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                7. Returns, Exchanges, and Refunds
              </h2>
              <div className="space-y-3">
                <p>
                  <strong className="text-charcoal">7.1 Eligibility:</strong> Items may be returned or exchanged within 7 days of delivery, provided that the item is unused, unworn, and in its original condition and packaging, with tags attached.
                </p>
                <p>
                  <strong className="text-charcoal">7.2 Process:</strong> To initiate a return or exchange, please contact us at <a href="mailto:info@hausofhafsah.com" className="text-accent underline">info@hausofhafsah.com</a> within the eligibility window, quoting your order number.
                </p>
                <p>
                  <strong className="text-charcoal">7.3 Refunds:</strong> Approved refunds will be issued to the original payment method within 1-2 business days of us receiving and inspecting the returned item. Refunds for Cash on Delivery orders will be processed via bank transfer.
                </p>
                <p>
                  <strong className="text-charcoal">7.4 Damaged or Incorrect Items:</strong> If you receive a damaged, defective, or incorrect item, please contact us within 7 days of delivery with photographic evidence, and we will arrange a replacement, exchange, or refund at no additional cost to you.
                </p>
              </div>
            </section>

            {/* 8. PRODUCT REVIEWS AND USER-GENERATED CONTENT */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                8. Product Reviews and User-Generated Content
              </h2>
              <div className="space-y-3">
                <p>
                  <strong className="text-charcoal">8.1 License:</strong> By submitting a product review or other content to the Service, you grant us a non-exclusive, royalty-free, worldwide license to display, reproduce, and use that content in connection with the Service and our marketing.
                </p>
                <p>
                  <strong className="text-charcoal">8.2 Content Standards:</strong> You agree that any content you submit will not be false, misleading, defamatory, obscene, or infringe upon the rights of any third party.
                </p>
                <p>
                  <strong className="text-charcoal">8.3 Moderation:</strong> We reserve the right to remove or decline to publish any review or content at our discretion, including where we believe it does not reflect a genuine purchase experience, violates these Terms, or is otherwise inappropriate.
                </p>
                <p>
                  <strong className="text-charcoal">8.4 Guest Review Verification:</strong> Reviews submitted via Guest Checkout are verified against completed order records associated with the email address provided; we do not independently verify the identity of the reviewer beyond this email match.
                </p>
              </div>
            </section>

            {/* 9. INTELLECTUAL PROPERTY */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                9. Intellectual Property
              </h2>
              <p>
                All content on the Service, including but not limited to text, graphics, logos, images, product designs, and the &quot;Haus of Hafsah&quot; name and branding, is the property of Haus of Hafsah or its licensors and is protected by applicable intellectual property laws. You may not reproduce, distribute, modify, or create derivative works from any part of the Service without our prior written consent.
              </p>
            </section>

            {/* 10. PROHIBITED CONDUCT */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                10. Prohibited Conduct
              </h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Use the Service for any unlawful purpose or in violation of these Terms;</li>
                <li>Attempt to gain unauthorized access to any part of the Service, other users&apos; accounts, or our systems;</li>
                <li>Submit false, fraudulent, or misleading information, including false claims regarding purchases for the purpose of submitting reviews;</li>
                <li>Interfere with or disrupt the operation of the Service, including through the introduction of malicious code;</li>
                <li>Use any automated means (bots, scrapers) to access the Service without our prior written consent.</li>
              </ul>
            </section>

            {/* 11. THIRD-PARTY SERVICES AND LINKS */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                11. Third-Party Services and Links
              </h2>
              <p>
                The Service may contain links to or integrate with third-party services (including our payment processor, delivery partners, and social media platforms). We are not responsible for the content, policies, or practices of any third-party service, and your use of such services is governed by their own terms and policies.
              </p>
            </section>

            {/* 12. DISCLAIMER OF WARRANTIES */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                12. Disclaimer of Warranties
              </h2>
              <p>
                The Service and all products are provided on an &quot;as is&quot; and &quot;as available&quot; basis, without warranties of any kind, whether express or implied, to the maximum extent permitted by applicable law. We do not warrant that the Service will be uninterrupted, error-free, or entirely secure.
              </p>
            </section>

            {/* 13. LIMITATION OF LIABILITY */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                13. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law, Haus of Hafsah shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service or any products purchased through it. Our total liability for any claim arising from your use of the Service or a purchase shall not exceed the amount you paid for the relevant order.
              </p>
              <p>
                Nothing in these Terms limits or excludes any liability that cannot be limited or excluded under applicable Pakistani consumer protection law.
              </p>
            </section>

            {/* 14. INDEMNIFICATION */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                14. Indemnification
              </h2>
              <p>
                You agree to indemnify and hold harmless Haus of Hafsah, its officers, employees, and affiliates from any claims, damages, losses, or expenses (including reasonable legal fees) arising from your violation of these Terms or your misuse of the Service.
              </p>
            </section>

            {/* 15. GOVERNING LAW AND JURISDICTION */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                15. Governing Law and Jurisdiction
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan. Any disputes arising out of or in connection with these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of Karachi, Pakistan.
              </p>
            </section>

            {/* 16. CHANGES TO THESE TERMS */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                16. Changes to These Terms
              </h2>
              <p>
                We reserve the right to modify these Terms at any time. We will indicate the date of the most recent revision at the top of this page. Your continued use of the Service after any changes constitutes your acceptance of the revised Terms.
              </p>
            </section>

            {/* 17. SEVERABILITY */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                17. Severability
              </h2>
              <p>
                If any provision of these Terms is found to be unenforceable or invalid under applicable law, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall continue in full force and effect.
              </p>
            </section>

            {/* 18. CONTACT US */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                18. Contact Us
              </h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="bg-beige/10 border border-border/40 rounded-md p-4 space-y-1 font-sans text-xs">
                <p><strong className="text-charcoal">Email:</strong> <a href="mailto:info@hausofhafsah.com" className="text-accent underline">info@hausofhafsah.com</a></p>
                <p><strong className="text-charcoal">Address:</strong> Karachi, Pakistan</p>
              </div>
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
