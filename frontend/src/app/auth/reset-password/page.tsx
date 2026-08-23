'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Mail, ShieldCheck, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { resetPassword, forgotPassword } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const resetPasswordSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    otpCode: z.string().length(6, 'Verification code must be exactly 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  // Eye toggle state for New Password & Confirm Password
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailParam,
      otpCode: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const emailValue = watch('email');

  useEffect(() => {
    if (emailParam) {
      setValue('email', emailParam);
    }
  }, [emailParam, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      await resetPassword({
        email: data.email,
        otpCode: data.otpCode,
        newPassword: data.newPassword,
      });
      toast.success('Password updated successfully! Please sign in with your new password.');
      router.push('/auth/login');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Password reset failed. Please check your verification code.';
      toast.error(msg);
    }
  };

  const handleResendCode = async () => {
    if (!emailValue) {
      toast.error('Please enter your email address to resend the code.');
      return;
    }
    try {
      setResending(true);
      await forgotPassword(emailValue);
      toast.success('A new 6-digit verification code has been sent to your email!');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to resend code. Please try again.';
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-beige/10 border border-border/40 rounded-md p-8 sm:p-10 shadow-xs">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-3xl text-charcoal tracking-wide">
            Reset Password
          </h2>
          <p className="mt-2 font-sans text-xs text-brown-muted leading-relaxed">
            Enter the 6-digit verification code sent to your email and create a new password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5 font-sans">
          <div className="space-y-4">
            {/* Email Address */}
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

            {/* 6-Digit OTP Code */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-brown-muted uppercase tracking-wider">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="text-[10px] text-accent hover:underline font-semibold disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              </div>
              <Input
                type="text"
                maxLength={6}
                placeholder="123456"
                className={`text-center font-mono text-lg tracking-[0.5em] font-bold ${
                  errors.otpCode ? 'border-error' : 'border-border'
                }`}
                {...register('otpCode')}
              />
              {errors.otpCode && (
                <p className="text-[10px] text-error mt-1">{errors.otpCode.message}</p>
              )}
            </div>

            {/* New Password with Eye Toggle */}
            <div>
              <label className="block text-xs font-semibold text-brown-muted uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-brown-muted" />
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 ${errors.newPassword ? 'border-error' : 'border-border'}`}
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-brown-muted hover:text-charcoal focus:outline-none transition-colors"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-[10px] text-error mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm New Password with Eye Toggle */}
            <div>
              <label className="block text-xs font-semibold text-brown-muted uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-brown-muted" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-error' : 'border-border'}`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-brown-muted hover:text-charcoal focus:outline-none transition-colors"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[10px] text-error mt-1">{errors.confirmPassword.message}</p>
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
                  Updating Password...
                </>
              ) : (
                'Update Password'
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

