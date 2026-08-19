'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { login, loginWithFirebase } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await login(data);
      setAuth(response);
      toast.success('Logged in successfully');
      router.push('/shop');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      toast.error(msg);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const response = await loginWithFirebase(idToken);
      setAuth(response);
      toast.success('Logged in with Google successfully');
      router.push('/shop');
    } catch (error) {
      console.error('Google Sign In failed:', error);
      const msg = error instanceof Error ? error.message : 'Google Sign In failed. Please try again.';
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-beige/10 border border-border/40 rounded-md p-8 sm:p-10 shadow-xs">
        <div className="text-center">
          <h2 className="font-serif text-3xl text-charcoal tracking-wide">
            Welcome Back
          </h2>
          <p className="mt-2 font-sans text-xs text-brown-muted">
            Access your order history, delivery details, and wardrobe wishlist.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6 font-sans">
          <div className="space-y-4">
            {/* Email */}
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

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-brown-muted uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[10px] text-accent hover:underline font-semibold"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-brown-muted" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className={`pl-10 ${errors.password ? 'border-error' : 'border-border'}`}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-[10px] text-error mt-1">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isSubmitting || googleLoading}
              className="w-full bg-accent text-background hover:bg-accent/90 py-3 rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </div>
        </form>

        {/* Social Auth */}
        <div className="mt-6 border-t border-border/40 pt-6 space-y-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || isSubmitting}
            className="w-full border-border text-brown-muted hover:bg-beige/10 py-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition duration-150"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>
        </div>

        <div className="text-center font-sans text-xs text-brown-muted">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-accent hover:underline font-semibold">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
