'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, Phone, Globe, Loader2, ArrowRight, AlertCircle, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { submitContact } from '@/lib/api/contact';
import { getPageConfig, PageConfigDTO } from '@/lib/api/pages';
import UrlSanitizer from '@/components/common/UrlSanitizer';

function ContactContent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const [pageConfig, setPageConfig] = useState<PageConfigDTO | null>(null);

  const searchParams = useSearchParams();
  const token = searchParams.get('token') || undefined;

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await getPageConfig('CONTACT', token);
        setPageConfig(res);
        if (res?.metaTitle || res?.title) {
          document.title = `${res.metaTitle || res.title} — Haus of Hafsah`;
        } else {
          document.title = 'Contact Us — Haus of Hafsah';
        }
      } catch (err) {
        console.error('Failed to load contact page config:', err);
      }
    }
    loadConfig();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitContact(formData);
      toast.success('Your message has been received. We will get back to you shortly.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const headerTitle = pageConfig?.title || 'We would love to hear from you';
  const headerSubtitle = pageConfig?.subtitle || 'For order inquiries, bespoke sizing guidance, or collaborator discussions, reach out to our dedicated concierge.';
  const email = pageConfig?.contactEmail || 'info@hausofhafsah.com';
  const phone = pageConfig?.contactPhone || '+92 314 8730683';
  const address = pageConfig?.contactAddress || 'Block 4, Clifton, Karachi, Pakistan';
  const hours = pageConfig?.workingHours || 'Monday to Friday, 9:00 AM – 6:00 PM (PKT)';

  return (
    <div className="w-full bg-background min-h-[calc(100vh-4rem)]">
      <UrlSanitizer paramKey="token" />
      {/* Preview Banner */}
      {pageConfig?.isPreview && (
        <div className="w-full bg-accent/15 text-accent text-xs font-semibold px-4 py-3 text-center border-b border-accent/20 flex items-center justify-center gap-1.5 font-sans">
          <AlertCircle className="h-4 w-4" />
          <span>Preview Mode: You are viewing an unpublished draft of the Contact page.</span>
        </div>
      )}

      {/* Editorial Header */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="font-sans text-xs font-semibold uppercase tracking-widest text-accent">
          Contact Us
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal tracking-wide max-w-2xl mx-auto leading-tight">
          {headerTitle}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-brown-muted max-w-xl mx-auto leading-relaxed pt-2">
          {headerSubtitle}
        </p>
      </section>

      {/* Grid Layout: Contact Info & Form */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-start">
        {/* Info Column */}
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
          <div className="space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl text-charcoal tracking-wide font-normal">
              Concierge Desk
            </h2>
            <p className="font-sans text-xs sm:text-sm text-brown-muted leading-relaxed">
              Operating Hours: {hours}. We endeavor to respond to all customer inquiries promptly.
            </p>
          </div>

          <div className="space-y-6 font-sans text-xs sm:text-sm font-medium">
            {/* Email Card */}
            <div className="flex items-start gap-4 p-4 rounded-md border border-border/40 bg-beige/10 hover:bg-beige/20 transition-all duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent shrink-0 font-normal">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <span className="block font-semibold uppercase text-[10px] tracking-wider text-brown-muted">
                  Email Inquiry
                </span>
                <a
                  href={`mailto:${email}`}
                  className="block text-charcoal hover:text-accent transition-colors font-medium"
                >
                  {email}
                </a>
                <span className="text-[10px] text-brown-muted font-normal block">
                  For order status or boutique inquiries
                </span>
              </div>
            </div>

            {/* Phone Card */}
            <div className="flex items-start gap-4 p-4 rounded-md border border-border/40 bg-beige/10 hover:bg-beige/20 transition-all duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent shrink-0 font-normal">
                <Phone className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <span className="block font-semibold uppercase text-[10px] tracking-wider text-brown-muted">
                  Direct Line
                </span>
                <a
                  href={`tel:${phone}`}
                  className="block text-charcoal hover:text-accent transition-colors font-mono"
                >
                  {phone}
                </a>
                <span className="text-[10px] text-brown-muted font-normal block">
                  Voice call or WhatsApp Support
                </span>
              </div>
            </div>

            {/* Location Info Card */}
            <div className="flex items-start gap-4 p-4 rounded-md border border-border/40 bg-beige/10 hover:bg-beige/20 transition-all duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent shrink-0 font-normal">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <span className="block font-semibold uppercase text-[10px] tracking-wider text-brown-muted">
                  Boutique Location / Address
                </span>
                <span className="block text-charcoal font-medium">
                  {address}
                </span>
                <span className="text-[10px] text-brown-muted font-normal block leading-relaxed">
                  Headquarters & dispatch center
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="lg:col-span-7 bg-surface border border-border/40 p-6 sm:p-8 rounded-md shadow-xs">
          <h2 className="font-serif text-xl sm:text-2xl text-charcoal tracking-wide font-normal mb-6">
            Send a Message
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5 text-xs sm:text-sm font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="block font-semibold uppercase text-[10px] tracking-wider text-brown-muted">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your name"
                  className="w-full bg-background border border-border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-accent text-charcoal font-medium text-xs placeholder:text-brown-muted/40"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="block font-semibold uppercase text-[10px] tracking-wider text-brown-muted">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  className="w-full bg-background border border-border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-accent text-charcoal font-medium text-xs placeholder:text-brown-muted/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="subject" className="block font-semibold uppercase text-[10px] tracking-wider text-brown-muted">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Topic of inquiry"
                className="w-full bg-background border border-border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-accent text-charcoal font-medium text-xs placeholder:text-brown-muted/40"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="message" className="block font-semibold uppercase text-[10px] tracking-wider text-brown-muted">
                Message *
              </label>
              <textarea
                id="message"
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Compose your message..."
                className="w-full bg-background border border-border px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-accent text-charcoal font-medium text-xs placeholder:text-brown-muted/40 resize-none leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent/90 text-white font-sans text-xs font-semibold py-3 rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <ContactContent />
    </Suspense>
  );
}
