'use client';

import React from 'react';
import Link from 'next/link';

const OrderTrackingIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Truck Body */}
    <path d="M6 15h20v16H6z" />
    <path d="M26 21h8l4 4v6h-12v-10z" />
    {/* Wheels */}
    <circle cx="13" cy="33" r="3" />
    <circle cx="33" cy="33" r="3" />
    {/* Speed clock inside cargo */}
    <circle cx="16" cy="22" r="4.5" strokeWidth="1.2" />
    <path d="M16 19.5v2.5h2" strokeWidth="1.2" />
    {/* Motion lines */}
    <path d="M2 18h2M1 23h3M2 28h2" strokeWidth="1.2" />
  </svg>
);

const ExchangesReturnsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Package box */}
    <path d="M17 21l7-3.5 7 3.5v10.5l-7 3.5-7-3.5V21z" />
    <path d="M24 17.5v14" />
    <path d="M17 21l7 3.5 7-3.5" />
    {/* Circular return arrow surrounding parcel */}
    <path d="M13 18.5a13 13 0 1 1-2.5 11" strokeWidth="1.3" />
    <polyline points="9.5 14 13.5 18.5 17.5 14" strokeWidth="1.3" />
  </svg>
);

export default function FeatureBar() {
  return (
    <section className="w-full bg-[#F8F7F5] dark:bg-charcoal/40 border-y border-border/40 py-10 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 divide-y sm:divide-y-0 sm:divide-x divide-border/40">
          
          {/* Order Tracking Option */}
          <Link
            href="/track"
            className="group flex flex-col items-center justify-center text-center space-y-3 pt-4 sm:pt-0 hover:opacity-85 transition-all duration-200"
          >
            <div className="text-charcoal group-hover:text-accent group-hover:scale-105 transition-all duration-300">
              <OrderTrackingIcon />
            </div>
            <span className="font-sans text-xs sm:text-sm font-semibold tracking-[0.2em] text-charcoal group-hover:text-accent uppercase transition-colors">
              ORDER TRACKING
            </span>
          </Link>

          {/* Exchanges & Returns Option */}
          <Link
            href="/shipping-returns"
            className="group flex flex-col items-center justify-center text-center space-y-3 pt-6 sm:pt-0 hover:opacity-85 transition-all duration-200"
          >
            <div className="text-charcoal group-hover:text-accent group-hover:scale-105 transition-all duration-300">
              <ExchangesReturnsIcon />
            </div>
            <span className="font-sans text-xs sm:text-sm font-semibold tracking-[0.2em] text-charcoal group-hover:text-accent uppercase transition-colors">
              EXCHANGES &amp; RETURNS
            </span>
          </Link>

        </div>
      </div>
    </section>
  );
}
