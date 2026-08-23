'use client';

import React from 'react';
import { CreditCard, Truck, Loader2, ShieldCheck, CheckCircle2, ExternalLink, QrCode, Wallet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type PaymentIntentType = 'CYBERSOURCE' | 'MPGS' | 'PAYFAST' | 'RAAST';

interface PaymentStepProps {
  paymentMethod: 'cod' | 'card';
  cardIntent: PaymentIntentType;
  onPaymentMethodChange: (method: 'cod' | 'card') => void;
  onCardIntentChange: (intent: PaymentIntentType) => void;
  onPlaceOrder: () => Promise<void>;
  loading: boolean;
}

export default function PaymentStep({
  paymentMethod,
  cardIntent,
  onPaymentMethodChange,
  onCardIntentChange,
  onPlaceOrder,
  loading,
}: PaymentStepProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onPlaceOrder();
  };

  const intentOptions: { id: PaymentIntentType; name: string; desc: string }[] = [
    { id: 'CYBERSOURCE', name: 'Visa / Mastercard (CyberSource)', desc: 'Credit & Debit Cards' },
    { id: 'MPGS', name: 'Mastercard MPGS', desc: 'Mastercard Payment Gateway Services' },
    { id: 'PAYFAST', name: 'PayFast / UnionPay', desc: 'Local Cards & Digital Wallets' },
    { id: 'RAAST', name: 'Raast Instant Payment', desc: 'State Bank Raast QR & Instant Transfer' },
  ];

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
        onValueChange={(val: 'cod' | 'card') => onPaymentMethodChange(val)}
        className="grid grid-cols-1 gap-4"
      >
        {/* Cash on Delivery */}
        <div
          onClick={() => onPaymentMethodChange('cod')}
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

        {/* Credit/Debit Card & Digital Payments via SafePay */}
        <div
          onClick={() => onPaymentMethodChange('card')}
          className={`flex items-start gap-4 p-4 rounded-md border cursor-pointer transition-all duration-200 ${
            paymentMethod === 'card'
              ? 'border-accent bg-accent/5 ring-1 ring-accent'
              : 'border-border bg-background hover:border-charcoal/40'
          }`}
        >
          <RadioGroupItem value="card" id="card" className="mt-0.5" />
          <div className="flex-1 space-y-3">
            <div className="flex gap-3">
              <CreditCard className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <label htmlFor="card" className="block text-xs font-bold text-charcoal cursor-pointer">
                  Online Payment (SafePay Gateway)
                </label>
                <p className="mt-1 text-[11px] leading-relaxed text-brown-muted">
                  Pay securely using Visa, Mastercard, PayFast, or Raast via SafePay checkout.
                </p>
              </div>
            </div>

            {/* Payment Channel Intent Selector */}
            {paymentMethod === 'card' && (
              <div className="pt-2 border-t border-border/40 space-y-2" onClick={(e) => e.stopPropagation()}>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-brown-muted">
                  Select Preferred Payment Channel:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {intentOptions.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => onCardIntentChange(opt.id)}
                      className={`p-2.5 rounded border text-xs cursor-pointer transition-colors ${
                        cardIntent === opt.id
                          ? 'border-accent bg-accent/10 text-charcoal font-semibold'
                          : 'border-border/60 bg-background hover:border-charcoal/30 text-brown-muted'
                      }`}
                    >
                      <div className="font-semibold text-charcoal text-[11px]">{opt.name}</div>
                      <div className="text-[10px] text-brown-muted mt-0.5">{opt.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-accent font-medium pt-1">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>256-bit encrypted SSL payment via SafePay</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </RadioGroup>

      {/* Place Order / Payment CTA */}
      <div className="pt-4 border-t border-border/40">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-background hover:bg-accent/90 py-3 rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {paymentMethod === 'card' ? 'Connecting to SafePay...' : 'Processing Order...'}
            </>
          ) : paymentMethod === 'card' ? (
            <>
              <ExternalLink className="h-4 w-4" />
              Pay via SafePay ({cardIntent})
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Place Order (Cash on Delivery)
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
