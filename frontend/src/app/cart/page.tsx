'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Tag, X, Loader2 } from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getCart, updateCartItem, removeCartItem, addToCart } from '@/lib/api/cart';
import { validateDiscountCode } from '@/lib/api/discounts';
import CartItemVariantSelector from '@/components/cart/CartItemVariantSelector';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getOptimizedImageUrl } from '@/lib/image-loader';

export default function CartPage() {
  const {
    cart,
    setCart,
    loading,
    setLoading,
    getEffectiveUserId,
    appliedDiscountCode,
    discountAmount,
    setDiscount,
    clearDiscount,
  } = useCartStore();

  const authUserId = useAuthStore((state) => state.userId);
  const userId = getEffectiveUserId(authUserId);

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

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
    fetchCartData();
  }, [fetchCartData]);

  const items = cart?.items || [];
  const totalPrice = cart?.totalPrice || 0;
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const finalTotal = Math.max(0, totalPrice - (discountAmount || 0));

  const handleApplyPromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    if (appliedDiscountCode) {
      toast.error('A promo code is already applied. Remove it first to use another.');
      return;
    }

    try {
      setPromoLoading(true);
      setPromoError(null);
      const res = await validateDiscountCode(promoCodeInput.trim(), totalPrice);
      if (res.valid) {
        setDiscount(res.code, res.discountAmount);
        toast.success(`Promo code ${res.code} applied! Saved $${res.discountAmount.toFixed(2)}`);
        setPromoCodeInput('');
      } else {
        setPromoError(res.message || 'Invalid promo code');
      }
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : 'Failed to validate promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromoCode = () => {
    clearDiscount();
    toast.info('Promo code removed');
  };

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
      if ((updatedCart?.items || []).length === 0) {
        clearDiscount();
      }
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

  return (
    <div className="w-full bg-background min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-charcoal tracking-wide mb-8">
          Shopping Bag
        </h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-beige/10 rounded-md border border-dashed border-border/50">
            <div className="rounded-full bg-beige/35 p-4 text-brown-muted">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-xl font-medium text-charcoal">Your bag is empty</h2>
              <p className="font-sans text-xs text-brown-muted max-w-[280px]">
                Explore Haus of Hafsah collections and add some elegant pieces.
              </p>
            </div>
            <Link href="/shop" passHref>
              <Button className="mt-2 bg-accent text-background hover:bg-accent/90 font-sans text-xs font-semibold px-6 py-2.5 rounded-md">
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start">
            {/* Left: Items list */}
            <div className="lg:col-span-8 space-y-6">
              <div className="divide-y divide-border/60">
                {items.map((item) => (
                  <div key={item.productVariantId} className="py-6 flex gap-6 first:pt-0">
                    {/* Image */}
                    {item.productId ? (
                      <Link
                        href={`/product/${item.productId}`}
                        className="relative h-28 w-20 overflow-hidden rounded-md bg-beige/25 flex-shrink-0 block hover:opacity-85 transition-opacity"
                      >
                        {item.imageUrl ? (
                          <Image
                            src={getOptimizedImageUrl(item.imageUrl, 150)}
                            alt={item.productName}
                            fill
                            sizes="120px"
                            className="object-cover object-center"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-beige text-charcoal font-serif text-xs">
                            Haus
                          </div>
                        )}
                      </Link>
                    ) : (
                      <div className="relative h-28 w-20 overflow-hidden rounded-md bg-beige/25 flex-shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={getOptimizedImageUrl(item.imageUrl, 150)}
                            alt={item.productName}
                            fill
                            sizes="120px"
                            className="object-cover object-center"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-beige text-charcoal font-serif text-xs">
                            Haus
                          </div>
                        )}
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between text-sm sm:text-base">
                          <h3 className="font-serif text-charcoal font-medium">
                            {item.productId ? (
                              <Link href={`/product/${item.productId}`} className="hover:text-accent transition-colors">
                                {item.productName}
                              </Link>
                            ) : (
                              item.productName
                            )}
                          </h3>
                          <span className="font-sans font-semibold text-charcoal">
                            ${item.subtotal.toFixed(2)}
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
                          <p className="mt-1.5 font-sans text-xs text-brown-muted">
                            Variant: {item.variantName}
                          </p>
                        )}
                        <p className="mt-1 font-sans text-xs text-brown-muted">
                          Unit Price: ${item.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity Counter */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center border border-border rounded-md bg-beige/10">
                            <button
                              onClick={() => handleUpdateQuantity(item.productVariantId, item.quantity, -1)}
                              disabled={loading}
                              className="p-1.5 px-3 text-brown-muted hover:text-charcoal disabled:opacity-50 cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-3 text-xs font-sans font-semibold text-charcoal font-mono">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.productVariantId, item.quantity, 1)}
                              disabled={loading || (item.stockQuantity !== undefined && item.quantity >= item.stockQuantity)}
                              className="p-1.5 px-3 text-brown-muted hover:text-charcoal disabled:opacity-50 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          {item.stockQuantity !== undefined && item.quantity >= item.stockQuantity && (
                            <span className="text-[10px] font-sans font-medium text-error animate-pulse">
                              Max stock reached ({item.stockQuantity} available)
                            </span>
                          )}
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemoveItem(item.productVariantId)}
                          disabled={loading}
                          className="text-brown-muted hover:text-error transition-colors p-1.5 flex items-center gap-1.5 text-xs font-sans"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Order Summary Sidebar */}
            <div className="lg:col-span-4 bg-beige/10 border border-border/40 rounded-md p-6 space-y-6">
              <h2 className="font-serif text-lg font-semibold text-charcoal tracking-wide border-b border-border/40 pb-4">
                Order Summary
              </h2>

              <div className="space-y-4 font-sans text-xs text-brown-muted">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItemCount} items)</span>
                  <span className="text-charcoal font-medium">${totalPrice.toFixed(2)}</span>
                </div>
                {appliedDiscountCode && discountAmount > 0 && (
                  <div className="flex justify-between text-success font-semibold">
                    <span>Discount ({appliedDiscountCode})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-success font-semibold">Complimentary</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span className="text-charcoal font-medium">$0.00</span>
                </div>

                <div className="border-t border-border/40 pt-4 flex justify-between text-sm sm:text-base font-semibold text-charcoal">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Promo code area */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <label className="block font-sans text-[10px] uppercase tracking-wider text-brown-muted font-semibold">
                  Promo Code
                </label>
                {appliedDiscountCode ? (
                  <div className="flex items-center justify-between bg-success/10 border border-success/30 px-3 py-2 rounded-md text-xs text-success font-sans">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Tag className="h-3.5 w-3.5" />
                      <span>PROMO: {appliedDiscountCode} (-${discountAmount.toFixed(2)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromoCode}
                      className="p-1 hover:bg-success/20 rounded transition-colors text-success"
                      title="Remove promo code"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromoCode} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value.toUpperCase());
                        if (promoError) setPromoError(null);
                      }}
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-charcoal font-mono tracking-wider placeholder-brown-muted focus:outline-none focus:ring-1 focus:ring-accent uppercase"
                    />
                    <Button
                      type="submit"
                      disabled={promoLoading || !promoCodeInput.trim()}
                      variant="outline"
                      className="border-border text-charcoal hover:bg-blush/20 text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                    >
                      {promoLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                    </Button>
                  </form>
                )}
                {promoError && (
                  <p className="text-[11px] text-error font-medium font-sans">{promoError}</p>
                )}
              </div>

              <div className="pt-2">
                <Link href="/checkout" passHref>
                  <Button className="w-full bg-accent text-background hover:bg-accent/90 py-3 rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-2">
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <p className="font-sans text-[10px] text-brown-muted text-center leading-relaxed">
                By clicking proceed, you agree to our Terms & Conditions and Privacy Policies.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
