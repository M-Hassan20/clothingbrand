'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle, RefreshCw, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('order_id');

  const parsedOrderId = orderIdParam
    ? parseInt(orderIdParam.replace('order_', ''), 10)
    : null;

  return (
    <div className="w-full bg-background min-h-[calc(100vh-4rem)] flex items-center justify-center py-16">
      <div className="mx-auto max-w-lg px-4 text-center space-y-6">
        <div className="inline-flex rounded-full bg-amber-500/15 p-4 text-amber-600">
          <XCircle className="h-12 w-12" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl text-charcoal tracking-wide">
            Payment Cancelled
          </h1>
          <p className="font-sans text-xs text-brown-muted">
            Your payment session was cancelled or could not be completed. No charges were made to your account.
          </p>
        </div>

        {parsedOrderId && (
          <div className="bg-beige/10 border border-border/40 rounded-md p-4 text-center font-sans text-xs">
            <span className="text-brown-muted">Reference Order Number: </span>
            <span className="font-semibold text-charcoal">#{parsedOrderId}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/checkout" passHref>
            <Button className="w-full sm:w-auto bg-accent text-background hover:bg-accent/90 text-xs font-semibold px-6 py-2.5 rounded-md flex items-center justify-center gap-1.5">
              <RefreshCw className="h-4 w-4" />
              Try Again / Change Payment
            </Button>
          </Link>
          <Link href="/shop" passHref>
            <Button variant="outline" className="w-full sm:w-auto border-border text-charcoal text-xs font-semibold px-6 py-2.5 rounded-md flex items-center justify-center gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full bg-background min-h-[calc(100vh-4rem)] flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
