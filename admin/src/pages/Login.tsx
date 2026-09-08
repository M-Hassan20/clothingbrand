import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth } from '../stores/auth';
import { api, type AdminUser } from '../api/client';
import { Loader2, Lock, Mail, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const loginSchema = zod.object({
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = zod.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Admin Login — Haus of Hafsah';
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      // Send login request
      const response = await api.post<{
        token: string;
        userId: number;
        email: string;
        fullName: string;
        role: string;
      }>('/auth/login', data);

      if (response.role !== 'ADMIN') {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Save credentials in Auth Context
      const adminUser: AdminUser = {
        userId: response.userId,
        email: response.email,
        fullName: response.fullName,
        role: 'ADMIN',
      };
      
      login(response.token, adminUser);
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-bold text-text-primary tracking-widest uppercase">
          Haus of Hafsah
        </h1>
        <p className="text-xs uppercase tracking-wider text-text-secondary mt-1.5">
          Admin Control Panel
        </p>
      </div>

      {/* Card Layout */}
      <div className="w-full max-w-md bg-surface border border-border rounded-lg shadow-sm p-8">
        <h2 className="text-lg font-semibold text-text-primary text-center mb-6">
          Sign In
        </h2>

        {errorMsg && (
          <div className="mb-5 flex items-start gap-2.5 p-3 rounded bg-error/10 border border-error/20 text-error text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                disabled={submitting}
                data-testid="login-email-input"
                placeholder="admin@hausofhafsah.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent text-text-primary disabled:opacity-50"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-error font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Password
              </label>
              {/* Note: Password reset code comment as requested in specs page 4 */}
              {/* Note: No password reset flow for single admin (can reset via backend directly) */}
              <span className="text-[10px] text-text-secondary italic">Reset via DB</span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                disabled={submitting}
                data-testid="login-password-input"
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent text-text-primary disabled:opacity-50"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-error font-medium">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            data-testid="login-submit-button"
            className="w-full flex justify-center items-center py-2.5 px-4 bg-accent hover:bg-accent/90 text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 mt-6"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing In...
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
