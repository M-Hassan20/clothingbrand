'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Non-functional stub for now
    alert('Thank you for subscribing to our newsletter!');
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
              <a href="#" className="text-brown-muted hover:text-accent transition-colors">
                <InstagramIcon className="h-4 w-4" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="text-brown-muted hover:text-accent transition-colors">
                <FacebookIcon className="h-4 w-4" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="mailto:hausofhafsa@gmail.com" className="text-brown-muted hover:text-accent transition-colors">
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
                <Link href="/assistance/shipping" className="text-brown-muted hover:text-charcoal transition-colors">
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
                <Link href="/assistance/contact" className="text-brown-muted hover:text-charcoal transition-colors">
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
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-charcoal placeholder-brown-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <Button type="submit" size="icon" className="bg-accent text-background hover:bg-accent/90 shrink-0">
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
