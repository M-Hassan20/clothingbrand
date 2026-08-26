'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useWishlistStore } from '@/lib/stores/wishlist-store';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/api/auth';

interface MobileNavProps {
  onClose: () => void;
  links: { label: string; href: string }[];
}

export default function MobileNav({ onClose, links }: MobileNavProps) {
  const pathname = usePathname();
  const { isAuthenticated, fullName, clearAuth } = useAuthStore();
  const { wishlistVariantIds } = useWishlistStore();

  const wishlistCount = wishlistVariantIds.length;

  return (
    <div className="flex h-full flex-col justify-between px-6 py-8">
      {/* Navigation Links */}
      <nav className="flex flex-col space-y-6">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`font-sans text-lg tracking-wide transition-colors duration-200 ${
                isActive
                  ? 'text-accent font-medium'
                  : 'text-brown-muted hover:text-charcoal'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User Actions Section */}
      <div className="mt-auto border-t border-border pt-6">
        {isAuthenticated ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blush/30 text-charcoal font-serif font-bold">
                {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="font-sans text-sm font-medium text-charcoal">{fullName}</p>
                <Link
                  href="/account"
                  onClick={onClose}
                  className="font-sans text-xs text-accent hover:underline"
                >
                  View Profile
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link href="/account/wishlist" onClick={onClose} passHref className="w-full">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-border text-charcoal font-sans text-xs">
                  <Heart className="h-4 w-4" />
                  Wishlist ({wishlistCount})
                </Button>
              </Link>
              <Link href="/account/orders" onClick={onClose} passHref className="w-full">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-border text-charcoal font-sans text-xs">
                  Orders
                </Button>
              </Link>
            </div>

            <Button
              variant="ghost"
              onClick={async () => {
                try {
                  await logout();
                } catch (err) {
                  console.error('Failed to log out on server:', err);
                } finally {
                  clearAuth();
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-2 text-error hover:bg-error/5 font-sans text-sm"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-sans text-xs text-brown-muted text-center">
              Sign in to manage orders, addresses, and wishlist.
            </p>
            <Link href="/auth/login" onClick={onClose} passHref className="w-full block">
              <Button className="w-full bg-accent text-background hover:bg-accent/90 font-sans text-sm font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register" onClick={onClose} passHref className="w-full block">
              <Button variant="outline" className="w-full border-border text-charcoal hover:bg-blush/20 font-sans text-sm">
                Create Account
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
