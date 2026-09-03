'use client';

import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getCart, updateCartItem, removeCartItem, addToCart } from '@/lib/api/cart';
import CartItemVariantSelector from '@/components/cart/CartItemVariantSelector';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

export default function CartDrawer() {
  const {
    isOpen,
    setIsOpen,
    cart,
    setCart,
    loading,
    setLoading,
    getEffectiveUserId,
  } = useCartStore();
  
  const authUserId = useAuthStore((state) => state.userId);
  const userId = getEffectiveUserId(authUserId);

  const fetchCartData = useCallback(async () => {
    try {
      setLoading(true);
      const updatedCart = await getCart(userId);
      setCart(updatedCart);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, setCart, setLoading]);

  useEffect(() => {
    if (isOpen) {
      fetchCartData();
    }
  }, [isOpen, fetchCartData]);

  const handleUpdateQuantity = async (productVariantId: number, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty <= 0) {
      handleRemoveItem(productVariantId);
      return;
    }
    
    try {
      setLoading(true);
      const updatedCart = await updateCartItem(userId, productVariantId, newQty);
      setCart(updatedCart);
      toast.success('Cart updated');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update cart';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productVariantId: number) => {
    try {
      setLoading(true);
      const updatedCart = await removeCartItem(userId, productVariantId);
      setCart(updatedCart);
      toast.success('Item removed from cart');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to remove item';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVariantChange = async (oldVariantId: number, newVariantId: number) => {
    const item = items.find((i) => i.productVariantId === oldVariantId);
    if (!item) return;
    const qty = item.quantity;
    
    try {
      setLoading(true);
      await removeCartItem(userId, oldVariantId);
      const updatedCart = await addToCart(userId, newVariantId, qty);
      setCart(updatedCart);
      toast.success('Variant updated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update variant';
      toast.error(msg);
      fetchCartData();
    } finally {
      setLoading(false);
    }
  };


  const items = cart?.items || [];
  const totalPrice = cart?.totalPrice || 0;
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex h-full w-full flex-col bg-background p-0 sm:max-w-md border-l border-border">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border text-left">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-serif text-2xl tracking-wide text-charcoal flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-accent" />
              Your Bag
              {cartItemCount > 0 && (
                <span className="ml-2 font-sans text-xs bg-blush text-charcoal px-2 py-0.5 rounded-full font-medium">
                  {cartItemCount}
                </span>
              )}
            </SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            Displays list of selected items in your shopping bag
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable list of items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
              <p className="text-xs text-brown-muted">Updating your bag...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center space-y-4">
              <div className="rounded-full bg-beige/50 p-4">
                <ShoppingBag className="h-10 w-10 text-brown-muted" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-medium text-charcoal">Your bag is empty</h3>
                <p className="font-sans text-xs text-brown-muted max-w-[240px]">
                  Explore Haus of Hafsah collections and add some elegant pieces.
                </p>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                className="mt-2 bg-accent text-background hover:bg-accent/90 font-sans text-xs font-semibold px-6 py-2 rounded-md"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.productVariantId} className="flex gap-4 border-b border-border/40 pb-5">
                  {/* Product Image */}
                  {item.productId ? (
                    <Link
                      href={`/product/${item.productId}`}
                      onClick={() => setIsOpen(false)}
                      className="relative h-20 w-16 overflow-hidden rounded-md bg-beige/40 flex-shrink-0 block hover:opacity-85 transition-opacity"
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          sizes="80px"
                          className="object-cover object-center"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-beige text-charcoal font-serif text-[10px]">
                          No Image
                        </div>
                      )}
                    </Link>
                  ) : (
                    <div className="relative h-20 w-16 overflow-hidden rounded-md bg-beige/40 flex-shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          sizes="80px"
                          className="object-cover object-center"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-beige text-charcoal font-serif text-[10px]">
                          No Image
                        </div>
                      )}
                    </div>
                  )}

                  {/* Info details */}
                  <div className="flex flex-1 flex-col justify-between py-0.5">
                    <div>
                      <div className="flex justify-between text-sm">
                        {item.productId ? (
                          <Link
                            href={`/product/${item.productId}`}
                            onClick={() => setIsOpen(false)}
                            className="font-serif text-charcoal font-medium line-clamp-1 hover:text-accent transition-colors"
                          >
                            {item.productName}
                          </Link>
                        ) : (
                          <h4 className="font-serif text-charcoal font-medium line-clamp-1">
                            {item.productName}
                          </h4>
                        )}
                        <span className="font-sans font-medium text-charcoal">
                          Rs. {item.subtotal.toFixed(2)}
                        </span>
                      </div>
                      {item.productId ? (
                        <CartItemVariantSelector
                          productId={item.productId}
                          currentVariantId={item.productVariantId}
                          currentVariantName={item.variantName}
                          quantity={item.quantity}
                          onVariantChange={handleVariantChange}
                        />
                      ) : (
                        <p className="mt-1 font-sans text-xs text-brown-muted">
                          Variant: {item.variantName}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-border rounded-md bg-beige/25">
                        <button
                          onClick={() => handleUpdateQuantity(item.productVariantId, item.quantity, -1)}
                          disabled={loading}
                          className="p-1 px-2 text-brown-muted hover:text-charcoal disabled:opacity-50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 text-xs font-sans font-semibold text-charcoal">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.productVariantId, item.quantity, 1)}
                          disabled={loading}
                          className="p-1 px-2 text-brown-muted hover:text-charcoal disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.productVariantId)}
                        disabled={loading}
                        className="text-brown-muted hover:text-error transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info (Summary & CTA) */}
        {items.length > 0 && (
          <SheetFooter className="border-t border-border bg-beige/10 px-6 py-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-sans text-brown-muted font-medium">Subtotal</span>
              <span className="font-sans text-lg font-semibold text-charcoal">
                Rs. {totalPrice.toFixed(2)}
              </span>
            </div>
            <p className="font-sans text-[11px] text-brown-muted">
              Shipping & taxes calculated at checkout.
            </p>

            <div className="space-y-3">
              <Link href="/checkout" onClick={() => setIsOpen(false)} passHref>
                <Button className="w-full bg-accent text-background hover:bg-accent/90 py-3 rounded-md font-sans text-sm font-semibold flex items-center justify-center gap-2">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                href="/cart"
                onClick={() => setIsOpen(false)}
                className="block text-center font-sans text-xs text-accent hover:underline font-medium"
              >
                View Full Cart
              </Link>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
