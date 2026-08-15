'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Mail, User, Phone, Loader2 } from 'lucide-react';
import { register as registerApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(15, 'Phone number is too long'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const requestData = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      };
      await registerApi(requestData);
      toast.success('Account created successfully! Please sign in.');
      router.push('/auth/login');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-beige/10 border border-border/40 rounded-md p-8 sm:p-10 shadow-xs">
        <div className="text-center">
          <h2 className="font-serif text-3xl text-charcoal tracking-wide">
            Create Account
          </h2>
          <p className="mt-2 font-sans text-xs text-brown-muted">
            Join Haus of Hafsah to track your wardrobe orders and save edit favorites.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6 font-sans">
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-brown-muted uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-brown-muted" />
                <Input
                  type="text"
                  placeholder="Your Full Name"
                  className={`pl-10 ${errors.fullName ? 'border-error' : 'border-border'}`}
                  {...register('fullName')}
                />
              </div>
              {errors.fullName && (
                <p className="text-[10px] text-error mt-1">{errors.fullName.message}</p>
              )}
            </div>

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

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-brown-muted uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4.5 w-4.5 text-brown-muted" />
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className={`pl-10 ${errors.phone ? 'border-error' : 'border-border'}`}
                  {...register('phone')}
                />
              </div>
              {errors.phone && (
                <p className="text-[10px] text-error mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-brown-muted uppercase tracking-wider mb-1.5">
                Password
              </label>
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-brown-muted uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-brown-muted" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className={`pl-10 ${errors.confirmPassword ? 'border-error' : 'border-border'}`}
                  {...register('confirmPassword')}
                />
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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>
        </form>

        <div className="text-center font-sans text-xs text-brown-muted">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-accent hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
