'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiGet } from '@/lib/api/client';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No unsubscribe token provided.');
      return;
    }

    async function processUnsubscribe() {
      try {
        await apiGet(`/newsletter/unsubscribe?token=${encodeURIComponent(token!)}`);
        setStatus('success');
        setMessage('You have been successfully unsubscribed from the Haus of Hafsah newsletter.');
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Failed to unsubscribe. The link may be invalid or expired.');
      }
    }

    processUnsubscribe();
  }, [token]);

  return (
    <div className="mx-auto max-w-md bg-background border border-border rounded-lg p-8 sm:p-10 shadow-sm text-center space-y-6">
      {status === 'loading' && (
        <div className="space-y-4 py-8">
          <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" />
          <h1 className="font-serif text-2xl text-charcoal">Processing Unsubscribe Request...</h1>
          <p className="font-sans text-xs text-brown-muted">Please wait while we update your email preferences.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
          <h1 className="font-serif text-2xl text-charcoal">Unsubscribed Successfully</h1>
          <p className="font-sans text-xs text-brown-muted leading-relaxed">{message}</p>
          <div className="pt-4">
            <Link href="/">
              <Button className="bg-accent text-background hover:bg-accent/90 px-6 py-2.5 font-sans text-xs font-semibold">
                Return to Boutique
              </Button>
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <XCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h1 className="font-serif text-2xl text-charcoal">Unsubscribe Request Failed</h1>
          <p className="font-sans text-xs text-brown-muted leading-relaxed">{message}</p>
          <div className="pt-4">
            <Link href="/">
              <Button className="bg-accent text-background hover:bg-accent/90 px-6 py-2.5 font-sans text-xs font-semibold">
                Return to Boutique
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-beige/10">
      <Suspense fallback={
        <div className="mx-auto max-w-md bg-background border border-border rounded-lg p-8 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
          <p className="font-sans text-xs text-brown-muted">Loading...</p>
        </div>
      }>
        <UnsubscribeContent />
      </Suspense>
    </main>
  );
}
