'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, ShoppingBag, MapPin, Heart, LogOut, ChevronRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { logout } from '@/lib/api/auth';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, fullName, email, clearAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated && pathname !== '/account/wishlist') {
      router.push('/auth/login');
    }
  }, [mounted, isAuthenticated, pathname, router]);

  if (!mounted) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (pathname === '/account/wishlist') {
      return <div className="w-full bg-background min-h-[calc(100vh-4rem)]">{children}</div>;
    }
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Failed to log out on server:', err);
    } finally {
      clearAuth();
      router.push('/');
    }
  };

  const navItems = [
    { name: 'Profile Overview', href: '/account', icon: User },
    { name: 'Order History', href: '/account/orders', icon: ShoppingBag },
    { name: 'Saved Addresses', href: '/account/addresses', icon: MapPin },
    { name: 'My Wishlist', href: '/account/wishlist', icon: Heart },
  ];

  return (
    <div className="w-full bg-background min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Nav */}
          <aside className="lg:col-span-3 space-y-6 bg-beige/10 border border-border/40 rounded-md p-6 font-sans">
            <div className="space-y-1 pb-4 border-b border-border/40">
              <h2 className="font-serif text-lg text-charcoal font-medium truncate">
                {fullName || 'Customer Profile'}
              </h2>
              <p className="text-[11px] text-brown-muted truncate">{email}</p>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/account' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors duration-150 ${
                      isActive
                        ? 'bg-accent text-background'
                        : 'text-brown-muted hover:text-charcoal hover:bg-beige/25'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {!isActive && <ChevronRight className="h-3 w-3 text-brown-muted/55" />}
                  </Link>
                );
              })}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 mt-2 rounded-md text-xs font-semibold text-error hover:bg-error/5 transition-colors text-left"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Logout
              </button>
            </nav>
          </aside>

          {/* Main Account content panels */}
          <main className="lg:col-span-9 bg-background border border-border/40 rounded-md p-6 sm:p-8 min-h-[400px]">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}
