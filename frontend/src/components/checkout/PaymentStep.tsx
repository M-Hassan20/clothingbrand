'use client';

import React from 'react';
import { CreditCard, Truck, Loader2, ShieldCheck, CheckCircle2, ExternalLink, QrCode, Wallet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

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

        {/* Credit/Debit Card & Digital Payments via SafePay (Disabled - Coming Soon) */}
        <div
          onClick={() => {
            onPaymentMethodChange('cod');
            toast.info('SafePay online payments will be enabled shortly. Please select Cash on Delivery for now.');
          }}
          data-testid="payment-method-card"
          className="flex items-start gap-4 p-4 rounded-md border border-border/60 bg-beige/10 opacity-75 cursor-pointer relative"
        >
          <RadioGroupItem value="card" id="card" disabled className="mt-0.5 cursor-not-allowed" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brown-muted shrink-0" />
                <label htmlFor="card" className="text-xs font-bold text-charcoal cursor-pointer">
                  Online Payment (SafePay Gateway)
                </label>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                Coming Soon
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-brown-muted">
              Card payments, Mobile Wallets, & Raast Bank Transfer will be enabled shortly. Please use <strong>Cash on Delivery</strong> to complete your order today.
            </p>
          </div>
        </div>

        {/* PREVIOUS SAFEPAY ONLINE PAYMENT INTENT SELECTION (COMMENTED OUT UNTIL SAFEPAY GOES LIVE):
        {paymentMethod === 'card' && (
          <div className="ml-7 pt-2 space-y-3">
            <p className="text-[11px] font-semibold text-charcoal">Select Preferred Online Payment Channel:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {intentOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => onCardIntentChange(opt.id)}
                  className={`p-3 rounded-md border text-left cursor-pointer transition-all ${
                    cardIntent === opt.id
                      ? 'border-accent bg-accent/10 font-medium'
                      : 'border-border bg-background hover:bg-beige/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <span className="text-xs font-semibold text-charcoal">{opt.name}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-beige text-charcoal font-medium">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-brown-muted mt-1 leading-tight">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        */}
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
