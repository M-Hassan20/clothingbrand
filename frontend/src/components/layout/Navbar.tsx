'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useCartStore } from '@/lib/stores/cart-store';
import { useWishlistStore } from '@/lib/stores/wishlist-store';
import { getWishlistItems } from '@/lib/api/wishlist';
import { logout } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import MobileNav from './MobileNav';


export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, userId, fullName, clearAuth } = useAuthStore();
  const { cart, setIsOpen: setCartOpen } = useCartStore();
  const { wishlistVariantIds, setWishlistVariantIds } = useWishlistStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize wishlist from backend on mount or when user changes
  useEffect(() => {
    const syncWishlist = async () => {
      if (!isAuthenticated || !userId) {
        setWishlistVariantIds([]);
        return;
      }
      try {
        const items = await getWishlistItems(userId);
        const ids = items.map((item) => item.productVariant.id);
        setWishlistVariantIds(ids);
      } catch (err) {
        setWishlistVariantIds([]);
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          return;
        }
        console.error('Failed to synchronize wishlist:', err);
      }
    };
    syncWishlist();
  }, [isAuthenticated, userId, setWishlistVariantIds]);

  const cartItemCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const wishlistCount = wishlistVariantIds.length;

  const navLinks = [
    { label: 'Shop', href: '/shop' },
    { label: 'Categories', href: '/categories' },
    { label: 'Journal', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Hamburger & Logo */}
        <div className="flex items-center gap-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger render={
              <Button variant="ghost" size="icon" className="md:hidden text-charcoal hover:bg-blush/20">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            } />
            <SheetContent side="left" className="w-[300px] bg-background p-0 border-r border-border">
              <SheetHeader className="px-6 pt-6 pb-2 text-left">
                <SheetTitle className="flex items-center">
                  <img
                    src="/icon.png"
                    alt="Haus of Hafsah Logo"
                    className="h-10 w-auto object-contain shrink-0"
                  />
                </SheetTitle>
              </SheetHeader>
              <MobileNav onClose={() => setMobileMenuOpen(false)} links={navLinks} />
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center">
            <img
              src="/icon.png"
              alt="Haus of Hafsah Logo"
              className="h-27 w-auto object-contain shrink-0"
            />
          </Link>
        </div>

        {/* Center: Nav links (Desktop) */}
        <nav className="hidden md:flex space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-sans text-sm tracking-wide transition-colors duration-200 ${
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

        {/* Right: Search, Wishlist, Cart, Account */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          {/* Search Toggle */}
          <div className="relative flex items-center">
            {searchOpen && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
                  }
                }}
                className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center bg-beige border border-border rounded-md px-2 py-1 w-48 sm:w-64 transition-all duration-300"
              >
                <input
                  type="text"
                  placeholder="Search brand, collection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-charcoal placeholder-brown-muted outline-none w-full"
                  autoFocus
                />
                <Button type="submit" variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-transparent">
                  <Search className="h-3 w-3 text-brown-muted" />
                </Button>
              </form>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-charcoal hover:bg-blush/20 h-9 w-9 rounded-full"
            >
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              <span className="sr-only">Toggle search bar</span>
            </Button>
          </div>

          {/* Wishlist Link */}
          <Link href="/account/wishlist" passHref>
            <Button
              variant="ghost"
              size="icon"
              className="text-charcoal hover:bg-blush/20 h-9 w-9 rounded-full relative"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-semibold text-background">
                  {wishlistCount}
                </span>
              )}
              <span className="sr-only">Wishlist</span>
            </Button>
          </Link>

          {/* Cart Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCartOpen(true)}
            className="text-charcoal hover:bg-blush/20 h-9 w-9 rounded-full relative"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-semibold text-background">
                {cartItemCount}
              </span>
            )}
            <span className="sr-only">Shopping Cart</span>
          </Button>

          {/* Account Menu */}
          {isAuthenticated ? (
            <div className="relative group">
              <Link href="/account" passHref>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-charcoal hover:bg-blush/20 h-9 w-9 rounded-full"
                >
                  <User className="h-5 w-5" />
                  <span className="sr-only">Account</span>
                </Button>
              </Link>
              <div className="absolute right-0 top-9 mt-2 w-48 origin-top-right rounded-md border border-border bg-background shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1">
                <div className="px-4 py-2 border-b border-border text-xs text-charcoal font-medium">
                  Hello, {fullName?.split(' ')[0] || 'User'}
                </div>
                <Link href="/account" className="block px-4 py-2 text-xs text-brown-muted hover:text-charcoal hover:bg-beige/35">
                  My Profile
                </Link>
                <Link href="/account/orders" className="block px-4 py-2 text-xs text-brown-muted hover:text-charcoal hover:bg-beige/35">
                  My Orders
                </Link>
                <button
                  onClick={async () => {
                    try {
                      await logout();
                    } catch (err) {
                      console.error('Failed to log out on server:', err);
                    } finally {
                      clearAuth();
                    }
                  }}
                  className="w-full text-left block px-4 py-2 text-xs text-error hover:bg-error/5"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <Link href="/auth/login" passHref>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-charcoal hover:bg-blush/20 h-9 w-9 rounded-full"
                >
                  <User className="h-5 w-5" />
                  <span className="sr-only">Login</span>
                </Button>
              </Link>
              <div className="absolute right-0 top-9 mt-2 w-48 origin-top-right rounded-md border border-border bg-background shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1">
                <Link href="/auth/register" className="block px-4 py-2 text-xs text-brown-muted hover:text-charcoal hover:bg-beige/35 font-medium transition-colors">
                  Register
                </Link>
                <Link href="/auth/login" className="block px-4 py-2 text-xs text-brown-muted hover:text-charcoal hover:bg-beige/35 font-medium transition-colors">
                  Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
