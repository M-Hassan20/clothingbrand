'use client';

import React from 'react';
import Image from 'next/image';
import { CartItemDTO } from '@/types/api';

interface OrderSummaryProps {
  items: CartItemDTO[];
  totalPrice: number;
}

export default function OrderSummary({ items, totalPrice }: OrderSummaryProps) {
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="bg-beige/10 border border-border/40 rounded-md p-6 space-y-6">
      <h3 className="font-serif text-lg font-semibold text-charcoal tracking-wide border-b border-border/40 pb-4">
        Order Review
      </h3>

      {/* Mini Cart Items List */}
      <div className="divide-y divide-border/40 max-h-[240px] overflow-y-auto pr-2 scrollbar-thin">
        {items.map((item) => (
          <div key={item.productVariantId} className="py-3 flex gap-3 first:pt-0">
            <div className="relative h-14 w-10 overflow-hidden rounded-md bg-beige/25 flex-shrink-0">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.productName}
                  fill
                  sizes="60px"
                  className="object-cover object-center"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-beige text-charcoal font-serif text-[8px]">
                  Haus
                </div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between py-0.5">
              <div className="text-xs">
                <h4 className="font-serif text-charcoal font-medium line-clamp-1">
                  {item.productName}
                </h4>
                <p className="mt-0.5 font-sans text-[10px] text-brown-muted">
                  Variant: {item.variantName}
                </p>
              </div>
              <div className="flex justify-between items-baseline mt-1 text-[11px] font-sans text-brown-muted">
                <span>Qty: {item.quantity}</span>
                <span className="font-semibold text-charcoal">
                  ${item.subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Breakdowns */}
      <div className="border-t border-border/40 pt-4 space-y-3 font-sans text-xs text-brown-muted">
        <div className="flex justify-between">
          <span>Subtotal ({cartItemCount} items)</span>
          <span className="text-charcoal font-medium">${totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="text-success font-semibold">Complimentary</span>
        </div>
        <div className="flex justify-between">
          <span>Estimated Tax</span>
          <span className="text-charcoal font-medium">$0.00</span>
        </div>

        <div className="border-t border-border/40 pt-4 flex justify-between text-sm sm:text-base font-semibold text-charcoal">
          <span>Total</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
