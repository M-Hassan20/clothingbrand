'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, Download, ShoppingBag } from 'lucide-react';
import { verifySafePayPayment } from '@/lib/api/payment';
import { downloadOrderInvoice } from '@/lib/api/orders';
import { useCartStore } from '@/lib/stores/cart-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { clearCart } from '@/lib/api/cart';
import { PaymentResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const trackerToken = searchParams.get('tracker');
  const orderIdParam = searchParams.get('order_id');

  const { cart, setCart, getEffectiveUserId } = useCartStore();
  const { userId: authUserId } = useAuthStore();
  const userId = getEffectiveUserId(authUserId);

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      if (!trackerToken) {
        setError('Missing payment tracker token in redirect URL.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await verifySafePayPayment(trackerToken);
        setPayment(result);

        // Clear cart in store and server
        if (cart && cart.items.length > 0) {
          await clearCart(userId);
          setCart({
            userId,
            items: [],
            totalPrice: 0,
            lastUpdated: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('SafePay verification failed:', err);
        const msg = err instanceof Error ? err.message : 'Unable to verify payment status.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [trackerToken, userId, setCart, cart]);

  const handleDownloadInvoice = async (orderId: number) => {
    try {
      const blob = await downloadOrderInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      toast.error('Failed to download invoice');
    }
  };

  // Derive order ID from order_id query param ("order_123" -> 123) or fallback
  const parsedOrderId = orderIdParam
    ? parseInt(orderIdParam.replace('order_', ''), 10)
    : null;

  if (loading) {
    return (
      <div className="w-full bg-background min-h-[calc(100vh-4rem)] flex items-center justify-center py-16">
        <div className="mx-auto max-w-md px-4 text-center space-y-6">
          <div className="inline-flex rounded-full bg-accent/10 p-4 text-accent animate-pulse">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl text-charcoal tracking-wide">
              Verifying Your Payment
            </h1>
            <p className="font-sans text-xs text-brown-muted">
              Please wait while we confirm your payment transaction with SafePay...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !payment || payment.paymentStatus !== 'SUCCESS') {
    return (
      <div className="w-full bg-background min-h-[calc(100vh-4rem)] flex items-center justify-center py-16">
        <div className="mx-auto max-w-md px-4 text-center space-y-6">
          <div className="inline-flex rounded-full bg-destructive/15 p-4 text-destructive">
            <AlertCircle className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl text-charcoal tracking-wide">
              Payment Not Completed
            </h1>
            <p className="font-sans text-xs text-brown-muted">
              {error || 'The payment was not completed or verified. Your cart is still available so you can try again.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 justify-center pt-2">
            <Link href="/cart" passHref>
              <Button className="w-full bg-accent text-background hover:bg-accent/90 text-xs font-semibold py-2.5 rounded-md">
                Return to Bag & Retry Payment
              </Button>
            </Link>
            <Link href="/shop" passHref>
              <Button variant="outline" className="w-full border-border text-charcoal text-xs font-semibold py-2.5 rounded-md">
                Back to Shop
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background min-h-[calc(100vh-4rem)] flex items-center py-16">
      <div className="mx-auto max-w-lg px-4 text-center space-y-6">
        <div className="inline-flex rounded-full bg-success/15 p-4 text-success animate-bounce">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl text-charcoal tracking-wide">
            Payment Successful!
          </h1>
          <p className="font-sans text-xs text-brown-muted">
            Thank you for shopping with Haus of Hafsah. Your payment was verified and your order is confirmed.
          </p>
        </div>

        <div className="bg-beige/10 border border-border/40 rounded-md p-6 space-y-4 text-left font-sans text-xs">
          <div className="flex justify-between border-b border-border/40 pb-3">
            <span className="text-brown-muted">Payment Tracker</span>
            <span className="font-semibold text-charcoal font-mono text-[11px]">{payment.stripePaymentIntentId || trackerToken}</span>
          </div>
          {parsedOrderId && (
            <div className="flex justify-between border-b border-border/40 pb-3">
              <span className="text-brown-muted">Order Number</span>
              <span className="font-semibold text-charcoal">#{parsedOrderId}</span>
            </div>
          )}
          <div className="flex justify-between border-b border-border/40 pb-3">
            <span className="text-brown-muted">Amount Paid</span>
            <span className="font-semibold text-charcoal">
              {payment.currency} {Number(payment.amount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-brown-muted">Payment Status</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-success/15 text-success uppercase">
              {payment.paymentStatus}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {parsedOrderId && (
            <Button
              onClick={() => handleDownloadInvoice(parsedOrderId)}
              className="bg-accent text-background hover:bg-accent/90 text-xs font-semibold px-6 py-2.5 rounded-md flex items-center justify-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              Download Invoice
            </Button>
          )}
          <Link href="/shop" passHref>
            <Button variant="outline" className="border-border text-charcoal hover:bg-blush/20 text-xs font-semibold px-6 py-2.5 rounded-md w-full sm:w-auto flex items-center justify-center gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full bg-background min-h-[calc(100vh-4rem)] flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
