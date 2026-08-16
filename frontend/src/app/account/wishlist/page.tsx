'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Heart, Loader2, ShoppingBag, Trash2 } from 'lucide-react';
import { getWishlistItems, removeFromWishlist, WishlistItemResponse } from '@/lib/api/wishlist';
import { addToCart } from '@/lib/api/cart';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useCartStore } from '@/lib/stores/cart-store';
import { useWishlistStore } from '@/lib/stores/wishlist-store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AccountWishlistPage() {
  const authUserId = useAuthStore((state) => state.userId);
  const { setCart, getEffectiveUserId } = useCartStore();
  const { removeWishlistVariantId, guestWishlistItems } = useWishlistStore();

  const [wishlistItems, setWishlistItems] = useState<WishlistItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const userId = getEffectiveUserId(authUserId);

  const fetchWishlist = useCallback(async () => {
    if (!authUserId) {
      setWishlistItems(guestWishlistItems);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const list = await getWishlistItems(authUserId);
      setWishlistItems(list);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [authUserId, guestWishlistItems]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (itemId: number, variantId: number) => {
    setActionLoadingId(itemId);
    try {
      if (authUserId) {
        await removeFromWishlist(userId, variantId);
      }
      removeWishlistVariantId(variantId);
      setWishlistItems((prev) => prev.filter((item) => item.productVariant.id !== variantId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMoveToCart = async (item: WishlistItemResponse) => {
    setActionLoadingId(item.id);
    try {
      // 1. Add to cart
      const updatedCart = await addToCart(userId, item.productVariant.id, 1);
      setCart(updatedCart);

      // 2. Remove from wishlist
      await removeFromWishlist(userId, item.productVariant.id);
      removeWishlistVariantId(item.productVariant.id);

      // 3. Update local state list
      setWishlistItems((prev) => prev.filter((prevItem) => prevItem.id !== item.id));

      toast.success(`Moved "${item.productName}" to bag`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to move to bag';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="border-b border-border/40 pb-5">
        <h1 className="font-serif text-2xl text-charcoal tracking-wide">
          My Wishlist
        </h1>
        <p className="text-xs text-brown-muted mt-1">
          Elegant items you have curated for your capsule collection.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-beige/10 rounded-md border border-dashed border-border/50">
          <div className="rounded-full bg-beige/35 p-4 text-brown-muted">
            <Heart className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-lg font-medium text-charcoal">Your wishlist is empty</h2>
            <p className="text-xs text-brown-muted max-w-[280px]">
              Tap the heart icon on any product details or card to save edits here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wishlistItems.map((item) => {
            const variant = item.productVariant;
            const isItemBusy = actionLoadingId === item.id;
            return (
              <div
                key={item.id}
                className="border border-border/60 rounded-md p-4 bg-background flex gap-4 hover:border-charcoal/40 transition-colors"
              >
                {/* Variant Image */}
                <div className="relative h-28 w-20 bg-beige/35 overflow-hidden rounded-md flex-shrink-0">
                  {variant.publicImageUrl ? (
                    <Image
                      src={variant.publicImageUrl}
                      alt={item.productName}
                      fill
                      sizes="100px"
                      className="object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-serif text-[10px] text-brown-muted">
                      Haus
                    </div>
                  )}
                </div>

                {/* Info and Actions */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div className="space-y-1 text-xs">
                    <h3 className="font-serif text-sm font-semibold text-charcoal line-clamp-1">
                      {item.productName}
                    </h3>
                    <p className="text-brown-muted font-medium">
                      Variant: {variant.size} / {variant.color}
                    </p>
                    <p className="font-bold text-charcoal pt-0.5">
                      ${variant.price.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-brown-muted italic">
                      Added on {new Date(item.addedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/40 mt-3">
                    {variant.inStock ? (
                      <Button
                        onClick={() => handleMoveToCart(item)}
                        disabled={isItemBusy}
                        className="flex-1 bg-accent text-background hover:bg-accent/90 py-1.5 h-8 rounded-md font-sans text-[11px] font-semibold flex items-center justify-center gap-1.5"
                      >
                        {isItemBusy ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ShoppingBag className="h-3.5 w-3.5" />
                        )}
                        Move to Bag
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="flex-1 bg-beige/50 text-brown-muted py-1.5 h-8 rounded-md font-sans text-[11px] cursor-not-allowed border border-border/20"
                      >
                        Out of Stock
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => handleRemove(item.id, variant.id)}
                      disabled={isItemBusy}
                      className="border-border text-brown-muted hover:text-error hover:bg-error/5 h-8 w-8 p-0 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
