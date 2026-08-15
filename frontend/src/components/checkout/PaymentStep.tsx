'use client';

import React, { useState } from 'react';
import { CreditCard, Truck, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PaymentStepProps {
  onPlaceOrder: () => Promise<void>;
  loading: boolean;
}

export default function PaymentStep({ onPlaceOrder, loading }: PaymentStepProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onPlaceOrder();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans">
      <div className="space-y-1">
        <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-charcoal">
          Payment Method
        </h3>
        <p className="text-xs text-brown-muted">
          Select how you would like to settle your order.
        </p>
      </div>

      <RadioGroup
        value={paymentMethod}
        onValueChange={(val: 'cod' | 'card') => setPaymentMethod(val)}
        className="grid grid-cols-1 gap-4"
      >
        {/* Cash on Delivery (Enabled) */}
        <div
          onClick={() => setPaymentMethod('cod')}
          className={`flex items-start gap-4 p-4 rounded-md border cursor-pointer transition-all duration-200 ${
            paymentMethod === 'cod'
              ? 'border-accent bg-accent/5 ring-1 ring-accent'
              : 'border-border bg-background hover:border-charcoal/40'
          }`}
        >
          <RadioGroupItem value="cod" id="cod" className="mt-0.5" />
          <div className="flex-1 flex gap-3">
            <Truck className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <label htmlFor="cod" className="block text-xs font-bold text-charcoal cursor-pointer">
                Cash on Delivery (COD)
              </label>
              <p className="mt-1 text-[11px] leading-relaxed text-brown-muted">
                Settle payment in cash upon physical receipt of delivery. Compliant package verification allowed at your doorstep.
              </p>
            </div>
          </div>
        </div>

        {/* Credit/Debit Card (Stubbed/Disabled) */}
        <div
          onClick={() => setPaymentMethod('card')}
          className={`flex items-start gap-4 p-4 rounded-md border cursor-pointer transition-all duration-200 ${
            paymentMethod === 'card'
              ? 'border-accent bg-accent/5 ring-1 ring-accent'
              : 'border-border bg-background hover:border-charcoal/40'
          }`}
        >
          <RadioGroupItem value="card" id="card" className="mt-0.5" />
          <div className="flex-1 flex gap-3">
            <CreditCard className="h-5 w-5 text-brown-muted shrink-0 mt-0.5" />
            <div>
              <label htmlFor="card" className="block text-xs font-bold text-charcoal cursor-pointer">
                Credit / Debit Card
              </label>
              <p className="mt-1 text-[11px] leading-relaxed text-brown-muted">
                Pay online using Visa, Mastercard, or American Express.
              </p>
              
              {paymentMethod === 'card' && (
                <div className="mt-3 inline-flex items-center gap-1.5 p-2 rounded bg-beige/40 text-[10px] text-brown-muted border border-border/40">
                  <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span>Card integration is coming soon. Please use Cash on Delivery for now.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </RadioGroup>

      {/* Place Order CTA */}
      <div className="pt-4 border-t border-border/40">
        <Button
          type="submit"
          disabled={loading || paymentMethod !== 'cod'}
          className="w-full bg-accent text-background hover:bg-accent/90 py-3 rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing Order...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Place Order
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
