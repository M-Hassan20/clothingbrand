'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api/client';

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      await apiPost('/newsletter/subscribe', { email: email.trim() });
      toast.success('Thank you for subscribing to Haus of Hafsah!');
      setEmail('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Subscription failed';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="w-full bg-beige/35 border-t border-border mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:gap-16">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link href="/" className="font-serif text-xl font-bold tracking-wider text-charcoal">
              HAUS OF HAFSAH
            </Link>
            <p className="font-sans text-xs leading-relaxed text-brown-muted">
              Minimalistic & neutral premium apparel designed for modern elegance. Warm palettes, soft fabrics, and editorial silhouettes.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="https://www.instagram.com/hausofhafsah?igsh=d2gydW11Z21uYXBs" className="text-brown-muted hover:text-accent transition-colors">
                <InstagramIcon className="h-4 w-4" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="https://www.facebook.com/share/1AJTH3rUxL/" className="text-brown-muted hover:text-accent transition-colors">
                <FacebookIcon className="h-4 w-4" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="mailto:info@hausofhafsah.com" className="text-brown-muted hover:text-accent transition-colors">
                <Mail className="h-4 w-4" />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>

          {/* Shop Col */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-charcoal tracking-wide mb-4">Shop</h4>
            <ul className="space-y-2.5 font-sans text-xs">
              <li>
                <Link href="/shop?sortBy=createdAt&sortDir=DESC" className="text-brown-muted hover:text-charcoal transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/shop?filter=best-sellers" className="text-brown-muted hover:text-charcoal transition-colors">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-brown-muted hover:text-charcoal transition-colors">
                  All Collections
                </Link>
              </li>
            </ul>
          </div>

          {/* Assistance Col */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-charcoal tracking-wide mb-4">Assistance</h4>
            <ul className="space-y-2.5 font-sans text-xs">
              <li>
                <Link href="/track" className="text-brown-muted hover:text-charcoal transition-colors font-medium">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="text-brown-muted hover:text-charcoal transition-colors">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/assistance/size-guide" className="text-brown-muted hover:text-charcoal transition-colors">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link href="/assistance/faq" className="text-brown-muted hover:text-charcoal transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-brown-muted hover:text-charcoal transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Col */}
          <div className="space-y-4">
            <h4 className="font-serif text-sm font-semibold text-charcoal tracking-wide">Newsletter</h4>
            <p className="font-sans text-xs text-brown-muted">
              Subscribe to receive updates on collections, private events, and styling inspiration.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-sm">
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-charcoal placeholder-brown-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <Button
                type="submit"
                disabled={submitting}
                size="icon"
                className="bg-accent text-background hover:bg-accent/90 shrink-0"
              >
                <ArrowRight className="h-4 w-4" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="font-sans text-[11px] text-brown-muted">
            &copy; {new Date().getFullYear()} Haus of Hafsah. All rights reserved.
          </p>
          <div className="flex gap-4 font-sans text-[11px]">
            <Link href="/privacy" className="text-brown-muted hover:text-charcoal">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-brown-muted hover:text-charcoal">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
