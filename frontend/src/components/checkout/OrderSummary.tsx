'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Tag, Check, X, Loader2 } from 'lucide-react';
import { CartItemDTO } from '@/types/api';

interface OrderSummaryProps {
  items: CartItemDTO[];
  totalPrice: number;
  appliedCode?: string | null;
  discountAmount?: number;
  onApplyDiscount?: (code: string) => Promise<void>;
  onRemoveDiscount?: () => void;
}

export default function OrderSummary({
  items,
  totalPrice,
  appliedCode,
  discountAmount = 0,
  onApplyDiscount,
  onRemoveDiscount,
}: OrderSummaryProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const netSubtotal = Math.max(0, totalPrice - discountAmount);
  const isFreeShipping = netSubtotal >= 5000;
  const shippingFee = cartItemCount > 0 ? (isFreeShipping ? 0 : 300) : 0;
  const finalTotal = netSubtotal + shippingFee;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !onApplyDiscount) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      await onApplyDiscount(code.trim());
      setCode('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid promo code');
    } finally {
      setLoading(false);
    }
  };

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
                  Rs. {item.subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code Input */}
      {onApplyDiscount && (
        <div className="border-t border-border/40 pt-4 space-y-2 font-sans">
          {appliedCode ? (
            <div className="flex items-center justify-between bg-success/10 border border-success/30 px-3 py-2 rounded-md text-xs text-success">
              <div className="flex items-center gap-1.5 font-semibold">
                <Tag className="h-3.5 w-3.5" />
                <span>PROMO: {appliedCode} (-Rs. {discountAmount.toFixed(2)})</span>
              </div>
              {onRemoveDiscount && (
                <button
                  type="button"
                  onClick={onRemoveDiscount}
                  className="p-1 hover:bg-success/20 rounded transition-colors text-success"
                  title="Remove promo code"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleApply} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Promo Code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-xs font-mono tracking-wider text-charcoal focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="bg-charcoal text-background hover:bg-charcoal/90 disabled:opacity-50 text-xs font-semibold px-4 py-2 rounded-md transition-colors flex items-center gap-1"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
              </button>
            </form>
          )}
          {errorMsg && (
            <p className="text-[11px] text-error font-medium">{errorMsg}</p>
          )}
        </div>
      )}

      {/* Pricing Breakdowns */}
      <div className="border-t border-border/40 pt-4 space-y-3 font-sans text-xs text-brown-muted">
        <div className="flex justify-between">
          <span>Subtotal ({cartItemCount} items)</span>
          <span className="text-charcoal font-medium">Rs. {totalPrice.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-success font-semibold">
            <span>Discount ({appliedCode})</span>
            <span>-Rs. {discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Shipping Fee</span>
          {isFreeShipping ? (
            <span className="text-success font-semibold">FREE (Over Rs. 5,000)</span>
          ) : (
            <span className="text-charcoal font-medium">Rs. 300.00</span>
          )}
        </div>
        <div className="flex justify-between">
          <span>Estimated Tax</span>
          <span className="text-charcoal font-medium">Rs. 0.00</span>
        </div>

        <div className="border-t border-border/40 pt-4 flex justify-between text-sm sm:text-base font-semibold text-charcoal">
          <span>Total</span>
          <span>Rs. {finalTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
