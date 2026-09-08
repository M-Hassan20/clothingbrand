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

  const intentOptions: {
    id: PaymentIntentType;
    name: string;
    badge: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'CYBERSOURCE',
      name: 'Credit / Debit Card',
      badge: 'Visa & Mastercard',
      desc: 'Pay using any Visa or Mastercard credit/debit card',
      icon: <CreditCard className="h-4 w-4 text-accent shrink-0" />,
    },
    {
      id: 'MPGS',
      name: 'Mastercard Direct',
      badge: 'Mastercard MPGS',
      desc: 'Direct payment gateway for Mastercard cardholders',
      icon: <CreditCard className="h-4 w-4 text-accent shrink-0" />,
    },
    {
      id: 'PAYFAST',
      name: 'PayFast & Mobile Wallets',
      badge: 'UnionPay & Wallets',
      desc: 'UnionPay cards, EasyPaisa, JazzCash & local wallets',
      icon: <Wallet className="h-4 w-4 text-accent shrink-0" />,
    },
    {
      id: 'RAAST',
      name: 'Raast Instant Payment',
      badge: 'Zero Fee',
      desc: 'Instant Bank Transfer / QR scan via State Bank Raast',
      icon: <Smartphone className="h-4 w-4 text-accent shrink-0" />,
    },
  ];

  const selectedIntentObj = intentOptions.find((opt) => opt.id === cardIntent) || intentOptions[0];

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
          data-testid="payment-method-cod"
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
                Settle payment in cash upon physical receipt of delivery. Doorstep package inspection available.
              </p>
            </div>
          </div>
        </div>

        {/* Credit/Debit Card & Digital Payments via SafePay */}
        <div
          onClick={() => onPaymentMethodChange('card')}
          data-testid="payment-method-card"
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
                  Instant secure payment via Credit/Debit Cards, Mobile Wallets, or Raast Bank Transfer.
                </p>
              </div>
            </div>

            {/* Payment Channel Intent Selector */}
            {paymentMethod === 'card' && (
              <div className="pt-3 border-t border-border/40 space-y-2.5" onClick={(e) => e.stopPropagation()}>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-brown-muted">
                  Select Your Preferred Payment Method:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {intentOptions.map((opt) => {
                    const isSelected = cardIntent === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => onCardIntentChange(opt.id)}
                        data-testid={`payment-channel-${opt.id.toLowerCase()}`}
                        className={`p-3 rounded-md border text-xs cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-accent bg-accent/10 shadow-xs ring-1 ring-accent/60'
                            : 'border-border/60 bg-background hover:border-charcoal/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <div className="flex items-center gap-2 font-bold text-charcoal text-xs">
                            {opt.icon}
                            <span>{opt.name}</span>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shrink-0 ${
                              isSelected
                                ? 'bg-accent text-background'
                                : 'bg-beige/40 text-brown-muted border border-border/40'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        </div>
                        <div className="text-[11px] text-brown-muted leading-tight pl-6">{opt.desc}</div>
                      </div>
                    );
                  })}
                </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-accent font-medium pt-1">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>256-bit Bank Grade Encrypted SSL Payment via SafePay</span>
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
          data-testid="checkout-place-order-button"
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
              Proceed to SafePay ({selectedIntentObj.name})
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
