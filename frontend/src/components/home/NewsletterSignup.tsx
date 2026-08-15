'use client';

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    // Simulate API registration delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitting(false);

    toast.success('Thank you for subscribing to Haus of Hafsah!');
    setEmail('');
  };

  return (
    <section className="bg-beige/20 border-t border-border py-16 sm:py-20 lg:py-28 text-center">
      <div className="mx-auto max-w-xl px-4 space-y-6">
        <div className="space-y-2">
          <span className="font-sans text-xs font-semibold uppercase tracking-widest text-accent">
            Join the Society
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-charcoal tracking-wide">
            Subscribe to the Newsletter
          </h2>
        </div>
        <p className="font-sans text-xs sm:text-sm text-brown-muted leading-relaxed max-w-md mx-auto">
          Receive exclusive early access to product releases, editorial features, private sales, and seasonal styling curation.
        </p>

        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
          <input
            type="email"
            required
            name="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-4 py-3 text-xs text-charcoal placeholder-brown-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <Button
            type="submit"
            disabled={submitting}
            className="bg-accent text-background hover:bg-accent/90 px-6 py-3 rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
          >
            <Mail className="h-4 w-4" />
            {submitting ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </form>
      </div>
    </section>
  );
}
