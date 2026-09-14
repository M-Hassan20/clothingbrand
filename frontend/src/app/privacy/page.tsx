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
  const subtitle = config?.subtitle || 'Last Updated: September 11, 2026';
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
            {/* 1. INTRODUCTION */}
            <section className="space-y-4">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                1. Introduction
              </h2>
              <p>
                This Privacy Policy explains how Haus of Hafsah (&quot;we,&quot; &quot;us,&quot; &quot;our,&quot; or the &quot;Company&quot;) collects, uses, stores, shares, and protects your personal information when you visit our website, create an account, place an order (as a registered customer or as a guest), or otherwise interact with our services (collectively, the &quot;Service&quot;).
              </p>
              <p>
                By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this policy, please do not use the Service.
              </p>
            </section>

            {/* 2. INFORMATION WE COLLECT */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                2. Information We Collect
              </h2>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-charcoal text-base">2.1 Information You Provide Directly</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-charcoal">Account Information:</strong> full name, email address, phone number, and password (stored in encrypted/hashed form — we never store your password in plain text).
                  </li>
                  <li>
                    <strong className="text-charcoal">Guest Checkout Information:</strong> if you check out as a guest, we collect your name, email address, phone number, and shipping address in order to fulfill your order. A lightweight customer profile is created internally to process your order and any future orders under the same email address, without requiring you to set a password or actively create an account.
                  </li>
                  <li>
                    <strong className="text-charcoal">Order Information:</strong> items purchased, shipping address, order history, and order status.
                  </li>
                  <li>
                    <strong className="text-charcoal">Payment Information:</strong> payments are processed by our third-party payment processor, SafePay. We do not collect or store your full card number, CVV, or banking credentials on our own servers. See Section 5 (Third-Party Services) for details.
                  </li>
                  <li>
                    <strong className="text-charcoal">Reviews and User Content:</strong> if you submit a product review, we collect the rating, written comment, and associate it with your account or the email address used for guest review verification. Reviews may be displayed publicly on product pages.
                  </li>
                  <li>
                    <strong className="text-charcoal">Communications:</strong> if you contact our customer support, we retain the content of that communication and your contact details in order to respond.
                  </li>
                  <li>
                    <strong className="text-charcoal">Newsletter Subscription:</strong> if you subscribe to our newsletter, we collect and retain your email address for that purpose until you unsubscribe.
                  </li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="font-semibold text-charcoal text-base">2.2 Information Collected Automatically</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-charcoal">Cookies and Similar Technologies:</strong> we use cookies and browser local storage to maintain your shopping cart (including for guest users, via an anonymous identifier), remember your login session, and store your wishlist if you are not logged in. See Section 6 (Cookies) for more detail.
                  </li>
                  <li>
                    <strong className="text-charcoal">Usage Data:</strong> we may automatically collect information such as your IP address, browser type, device type, pages visited, and time spent on the Service, for the purposes of security, fraud prevention, and improving the Service.
                  </li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="font-semibold text-charcoal text-base">2.3 Information from Third Parties</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-charcoal">Google Sign-In:</strong> if you choose to sign in using Google (via Firebase Authentication), we receive your name and email address from Google as provided by your Google account settings. We do not receive your Google password.
                  </li>
                </ul>
              </div>
            </section>

            {/* 3. HOW WE USE YOUR INFORMATION */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                3. How We Use Your Information
              </h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Process and fulfill your orders, including generating invoices and order confirmations;</li>
                <li>Create and maintain your account, including guest checkout profiles;</li>
                <li>Communicate with you about your orders, account, and customer support inquiries;</li>
                <li>Send you marketing communications and newsletters, where you have subscribed or otherwise consented, and provide an option to unsubscribe at any time;</li>
                <li>Display product reviews you have submitted;</li>
                <li>Verify that a submitted review corresponds to a genuine completed purchase;</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other unlawful activity;</li>
                <li>Improve, personalize, and maintain the performance and security of the Service;</li>
                <li>Comply with legal obligations.</li>
              </ul>
              <p className="font-semibold text-charcoal pt-1">
                We do not sell your personal information to third parties.
              </p>
            </section>

            {/* 4. LEGAL BASIS FOR PROCESSING (WHERE APPLICABLE) */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                4. Legal Basis for Processing (Where Applicable)
              </h2>
              <p>
                Where applicable data protection law requires a legal basis for processing, we rely on: performance of a contract (to fulfill your order), your consent (for marketing communications), and our legitimate business interests (fraud prevention, service improvement), balanced against your rights.
              </p>
            </section>

            {/* 5. THIRD-PARTY SERVICES */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                5. Third-Party Services
              </h2>
              <p>
                We share limited personal information with the following categories of third-party service providers, solely for the purpose of operating the Service:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-charcoal">Payment Processing (SafePay):</strong> to process your payment. SafePay&apos;s own privacy policy governs how they handle your payment card details.
                </li>
                <li>
                  <strong className="text-charcoal">Authentication (Firebase / Google):</strong> to enable Google Sign-In, if you choose to use it.
                </li>
                <li>
                  <strong className="text-charcoal">Media Storage (Cloudinary):</strong> used to host and optimize product and content images. This service does not receive your personal customer data.
                </li>
                <li>
                  <strong className="text-charcoal">Email Delivery:</strong> used to send transactional emails (order confirmations, password resets) and newsletters, where applicable.
                </li>
                <li>
                  <strong className="text-charcoal">Delivery / Courier Partners:</strong> your name, phone number, and shipping address are shared with our delivery partners solely for the purpose of delivering your order to you.
                </li>
              </ul>
              <p>
                We require that any third party with access to your personal information handle it in accordance with applicable data protection standards. We do not permit these providers to use your information for their own independent marketing purposes.
              </p>
            </section>

            {/* 6. COOKIES */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                6. Cookies
              </h2>
              <p>We use the following types of cookies and browser storage:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-charcoal">Essential Cookies/Storage:</strong> required for core functionality, such as maintaining your shopping cart (including a randomly generated identifier for guest users), your login session, and, for guests, your wishlist. The Service cannot function properly without these.
                </li>
                <li>
                  <strong className="text-charcoal">Preference Storage:</strong> used to remember display preferences.
                </li>
              </ul>
              <p>
                You can control or delete cookies through your browser settings; however, disabling essential cookies may prevent parts of the Service, such as the shopping cart, from working correctly.
              </p>
            </section>

            {/* 7. DATA RETENTION */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                7. Data Retention
              </h2>
              <p>
                We retain your personal information for as long as necessary to fulfill the purposes described in this policy, including:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-charcoal">Account information:</strong> for as long as your account remains active, and for a reasonable period thereafter to comply with legal, accounting, or reporting obligations;
                </li>
                <li>
                  <strong className="text-charcoal">Order records:</strong> retained for the period required by applicable tax and consumer protection laws;
                </li>
                <li>
                  <strong className="text-charcoal">Guest checkout profiles:</strong> retained in order to recognize you if you check out again with the same email address, and to maintain order history and invoice records.
                </li>
              </ul>
              <p>
                You may request deletion of your personal information as described in Section 9, subject to our legal obligation to retain certain records (such as transaction and tax records).
              </p>
            </section>

            {/* 8. DATA SECURITY */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                8. Data Security
              </h2>
              <p>
                We implement reasonable technical and organizational measures designed to protect your personal information, including password hashing, encrypted transmission (HTTPS/TLS), and role-based access controls limiting who within our organization can access customer data. However, no method of transmission or storage over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            {/* 9. YOUR RIGHTS */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                9. Your Rights
              </h2>
              <p>Depending on your jurisdiction, you may have the right to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Access the personal information we hold about you;</li>
                <li>Correct inaccurate or incomplete information;</li>
                <li>Request deletion of your personal information, subject to our legal retention obligations;</li>
                <li>Withdraw consent to marketing communications at any time (for example, via the unsubscribe link in any newsletter email);</li>
                <li>Object to or restrict certain processing of your information.</li>
              </ul>
              <p>
                To exercise any of these rights, please contact us using the details in Section 13.
              </p>
            </section>

            {/* 10. CHILDREN'S PRIVACY */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                10. Children&apos;s Privacy
              </h2>
              <p>
                The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us so that we can take appropriate action.
              </p>
            </section>

            {/* 11. INTERNATIONAL DATA TRANSFERS */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                11. International Data Transfers
              </h2>
              <p>
                Some of our third-party service providers (such as our payment, authentication, and media hosting providers) may process or store data on servers located outside Pakistan. By using the Service, you acknowledge that your information may be transferred to and processed in countries with data protection laws that may differ from those of your home jurisdiction.
              </p>
            </section>

            {/* 12. CHANGES TO THIS PRIVACY POLICY */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                12. Changes to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will indicate the date of the most recent revision at the top of this page. Continued use of the Service after any changes constitutes acceptance of the revised policy.
              </p>
            </section>

            {/* 13. CONTACT US */}
            <section className="space-y-4 pt-6 border-t border-border/40">
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                13. Contact Us
              </h2>
              <p>
                If you have questions about this Privacy Policy or wish to exercise your rights over your personal information, please contact us at:
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
