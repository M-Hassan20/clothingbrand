'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { forgotPassword } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type FormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await forgotPassword(data.email);
      setSubmittedEmail(data.email);
      toast.success('Verification code sent to your email!');
      // Navigate to reset password page passing email in query params
      router.push(`/auth/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to send reset code. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-beige/10 border border-border/40 rounded-md p-8 sm:p-10 shadow-xs">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-3xl text-charcoal tracking-wide">
            Forgot Password
          </h2>
          <p className="mt-2 font-sans text-xs text-brown-muted leading-relaxed">
            Enter your account email address. We will send you a 6-digit verification code to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6 font-sans">
          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-brown-muted uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-brown-muted" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  className={`pl-10 ${errors.email ? 'border-error' : 'border-border'}`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-[10px] text-error mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent text-background hover:bg-accent/90 py-3 rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </div>
        </form>

        <div className="pt-2 text-center font-sans text-xs">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-brown-muted hover:text-charcoal transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
