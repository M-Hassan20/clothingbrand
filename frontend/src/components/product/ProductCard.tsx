'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Loader2, Plus, Minus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductResponse, ProductVariantResponse } from '@/types/api';
import { getProductVariants } from '@/lib/api/products';
import { addToCart } from '@/lib/api/cart';
import { addToWishlist, removeFromWishlist } from '@/lib/api/wishlist';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useCartStore } from '@/lib/stores/cart-store';
import { useWishlistStore } from '@/lib/stores/wishlist-store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getOptimizedImageUrl } from '@/lib/image-loader';

interface ProductCardProps {
  product: ProductResponse;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { id, name, brand, minPrice, maxPrice, minSalePrice, maxSalePrice, thumbnailImage } = product;

  const router = useRouter();
  const { userId: authUserId, isAuthenticated } = useAuthStore();
  const { setCart, getEffectiveUserId } = useCartStore();
  const { addWishlistVariantId, removeWishlistVariantId, hasItem, addGuestWishlistItem } = useWishlistStore();

  const [variants, setVariants] = useState<ProductVariantResponse[]>([]);
  const [secondImage, setSecondImage] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingCart, setIsAddingCart] = useState(false);
  const [isAddingWishlist, setIsAddingWishlist] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);
  const [hideUnavailable, setHideUnavailable] = useState(false);

  useEffect(() => {
    if (isQuickAddOpen && variants.length > 0) {
      const firstInStock = variants.find((v) => v.stockQuantity > 0) || variants[0];
      if (firstInStock) {
        setSelectedSize(firstInStock.size);
        setSelectedColor(firstInStock.color);
        setQty(1);
      }
    }
  }, [isQuickAddOpen, variants]);

  const userId = getEffectiveUserId(authUserId);

  // Load variants on mount to check for secondary image and wishlist status
  useEffect(() => {
    let active = true;
    const fetchCardVariants = async () => {
      try {
        const productVariants = await getProductVariants(id);
        if (!active) return;
        setVariants(productVariants);

        // Find a second unique image from variants
        const defaultImg = thumbnailImage;
        const uniqueImg = productVariants.find(
          (v) => v.publicImageUrl && v.publicImageUrl !== defaultImg
        );
        if (uniqueImg) {
          setSecondImage(uniqueImg.publicImageUrl);
        }
      } catch (err) {
        console.error('Error fetching variants in ProductCard:', err);
      }
    };
    fetchCardVariants();
    return () => {
      active = false;
    };
  }, [id, thumbnailImage]);

  // Determine default variant: first in-stock variant, or fall back to variants[0]
  const defaultVariant = variants.find((v) => v.stockQuantity > 0) || variants[0] || null;
  const isWishlisted = defaultVariant ? hasItem(defaultVariant.id) : false;

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!defaultVariant) {
      toast.error('Product details loading, please try again.');
      return;
    }

    const variantId = defaultVariant.id;
    setIsAddingWishlist(true);

    try {
      if (isWishlisted) {
        // Optimistic update
        removeWishlistVariantId(variantId);
        if (isAuthenticated) {
          await removeFromWishlist(userId, variantId);
        }
        toast.success('Removed from wishlist');
      } else {
        // Optimistic update
        if (isAuthenticated) {
          addWishlistVariantId(variantId);
          await addToWishlist(userId, variantId);
        } else {
          addGuestWishlistItem({
            id: variantId,
            productVariant: {
              id: defaultVariant.id,
              size: defaultVariant.size,
              color: defaultVariant.color,
              price: defaultVariant.price,
              stockQuantity: defaultVariant.stockQuantity,
              sku: defaultVariant.sku,
              publicImageUrl: defaultVariant.publicImageUrl || thumbnailImage || '',
              inStock: defaultVariant.inStock,
            },
            productName: name,
            addedAt: new Date().toISOString(),
          });
        }
        toast.success('Added to wishlist');
      }
    } catch (err) {
      // Revert if error
      if (isWishlisted) {
        addWishlistVariantId(variantId);
      } else {
        removeWishlistVariantId(variantId);
      }
      const msg = err instanceof Error ? err.message : 'Wishlist update failed';
      toast.error(msg);
    } finally {
      setIsAddingWishlist(false);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickAddOpen(true);
  };

  const matchedVariant = variants.find(
    (v) =>
      v.size.toLowerCase() === selectedSize.toLowerCase() &&
      v.color.toLowerCase() === selectedColor.toLowerCase()
  );

  const handlePerformQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!matchedVariant) {
      toast.error('Please select valid options.');
      return;
    }

    try {
      setIsAddingCart(true);
      const updatedCart = await addToCart(userId, matchedVariant.id, qty);
      setCart(updatedCart);
      toast.success(`${name} added to bag`);
      setIsQuickAddOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add to cart';
      toast.error(msg);
    } finally {
      setIsAddingCart(false);
    }
  };

  // Render price tag
  const isProductDiscounted = minSalePrice !== undefined && minSalePrice !== null && minSalePrice < minPrice;

  const priceDisplay =
    minPrice === maxPrice
      ? `Rs. ${minPrice.toFixed(2)}`
      : `Rs. ${minPrice.toFixed(2)} - Rs. ${maxPrice.toFixed(2)}`;

  const salePriceDisplay =
    minSalePrice === maxSalePrice
      ? `Rs. ${(minSalePrice ?? minPrice).toFixed(2)}`
      : `Rs. ${(minSalePrice ?? minPrice).toFixed(2)} - Rs. ${(maxSalePrice ?? maxPrice).toFixed(2)}`;

  return (
    <div className="group relative block w-full" data-testid={`product-card-${id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-md bg-beige/30 aspect-[3/4] border border-border/10 shadow-xs"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Wishlist Heart Overlay */}
        <button
          onClick={handleToggleWishlist}
          disabled={isAddingWishlist}
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 shadow-xs text-charcoal backdrop-blur-xs hover:bg-background hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          {isAddingWishlist ? (
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
          ) : (
            <Heart
              className={`h-4 w-4 transition-colors ${
                isWishlisted ? 'fill-error text-error' : 'text-charcoal hover:text-error'
              }`}
            />
          )}
          <span className="sr-only">Toggle Wishlist</span>
        </button>

        {/* Clickable Image Link */}
        <Link href={`/product/${id}`} className="absolute inset-0 z-0 block h-full w-full">
          {/* Product Image Wrapper */}
          <div className="relative h-full w-full overflow-hidden">
            {thumbnailImage ? (
              <Image
                src={getOptimizedImageUrl(isHovered && secondImage ? secondImage : thumbnailImage, 400)}
                alt={name}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className={`object-cover object-center transition-transform duration-700 ease-out ${
                  isHovered && !secondImage ? 'scale-105' : 'scale-100'
                }`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-beige/40 text-brown-muted font-serif text-sm">
                Haus of Hafsah
              </div>
            )}
          </div>
        </Link>

        {/* Quick Add To Cart Button - Slide up overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full md:group-hover:translate-y-0 transition-transform duration-300 ease-out bg-gradient-to-t from-charcoal/30 to-transparent z-20">
          {defaultVariant?.inStock ? (
            <Button
              onClick={handleQuickAdd}
              disabled={isAddingCart}
              className="w-full bg-background/95 hover:bg-background text-charcoal hover:text-accent font-sans text-xs font-semibold py-2 rounded-md shadow-md border border-border/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isAddingCart ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShoppingBag className="h-3.5 w-3.5" />
              )}
              Quick Add
            </Button>
          ) : (
            <Button
              disabled
              className="w-full bg-background/80 text-brown-muted font-sans text-xs font-semibold py-2 rounded-md border border-border/20 cursor-not-allowed"
            >
              Out of Stock
            </Button>
          )}
        </div>

        {/* Mobile quick add floating drawer (always visible under hover height on mobile) */}
        <div className="absolute bottom-2 right-2 md:hidden z-20">
          {defaultVariant?.inStock && (
            <button
              onClick={handleQuickAdd}
              disabled={isAddingCart}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-background shadow-lg hover:scale-105 transition-transform cursor-pointer"
            >
              {isAddingCart ? (
                <Loader2 className="h-4 w-4 animate-spin text-background" />
              ) : (
                <ShoppingBag className="h-4 w-4 text-background" />
              )}
              <span className="sr-only">Add to cart</span>
            </button>
          )}
        </div>

        {/* Quick Add Options Overlay */}
        {isQuickAddOpen && (
          <div className="absolute inset-x-0 bottom-0 h-[62%] bg-background/95 backdrop-blur-xs flex flex-col justify-between p-4 z-30 transition-all duration-300 border-t border-border/20 shadow-lg rounded-b-md">
            {/* Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
              <span className="font-serif text-sm font-semibold text-charcoal tracking-wide">Options</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsQuickAddOpen(false);
                }}
                className="text-brown-muted hover:text-charcoal p-1 rounded-full hover:bg-beige/10 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable selectors */}
            <div className="flex-1 overflow-y-auto py-2 space-y-3 text-left">
              {/* Colors */}
              {Array.from(new Set(variants.map((v) => v.color))).filter(Boolean).length > 1 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-sans font-medium text-brown-muted uppercase tracking-wider">Color: {selectedColor}</span>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(variants.map((v) => v.color))).filter(Boolean).map((c) => (
                      <button
                        key={c}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedColor(c);
                        }}
                        className={`px-2 py-0.5 text-[10px] font-sans font-semibold rounded border transition-all cursor-pointer ${
                          selectedColor === c
                            ? 'bg-accent text-background border-accent'
                            : 'bg-background text-charcoal border-border hover:bg-beige/10'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans font-medium text-brown-muted uppercase tracking-wider">
                    Size: {selectedSize}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setHideUnavailable(!hideUnavailable);
                    }}
                    className="text-[9px] text-accent hover:underline font-sans font-semibold cursor-pointer"
                  >
                    {hideUnavailable ? 'Show All' : 'Hide Unavailable'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set(variants.map((v) => v.size))).filter(Boolean)
                    .filter((sz) => {
                      if (!hideUnavailable) return true;
                      const variant = variants.find(
                        (v) => v.size === sz && v.color === selectedColor
                      );
                      return variant && variant.stockQuantity > 0;
                    })
                    .map((sz) => {
                      const variant = variants.find(
                        (v) => v.size === sz && v.color === selectedColor
                      );
                      const isAvailable = variant && variant.stockQuantity > 0;
                      return (
                        <button
                          key={sz}
                          disabled={!isAvailable}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isAvailable) setSelectedSize(sz);
                          }}
                          className={`relative px-2.5 py-1 text-[10px] font-sans font-medium rounded border transition-all cursor-pointer ${
                            selectedSize === sz
                              ? 'bg-accent text-background border-accent'
                              : isAvailable
                              ? 'bg-background text-charcoal border-border hover:bg-beige/10'
                              : 'bg-beige/10 text-brown-muted/30 border-border/20 cursor-not-allowed overflow-hidden opacity-50'
                          }`}
                        >
                          {sz}
                          {!isAvailable && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-[130%] h-[1px] bg-brown-muted/40 rotate-[25deg]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Footer with Quantity Counter & Add button */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-sans font-medium text-brown-muted uppercase tracking-wider">Qty:</span>
                <div className="flex items-center border border-border rounded-md bg-beige/10">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQty(Math.max(1, qty - 1));
                    }}
                    className="p-1 px-2 text-brown-muted hover:text-charcoal cursor-pointer"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <span className="px-1.5 text-xs font-sans font-semibold text-charcoal font-mono">
                    {qty}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const maxStock = matchedVariant?.stockQuantity ?? 99;
                      setQty(Math.min(maxStock, qty + 1));
                    }}
                    disabled={qty >= (matchedVariant?.stockQuantity ?? 99)}
                    className="p-1 px-2 text-brown-muted hover:text-charcoal disabled:opacity-30 cursor-pointer"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                </div>
                {matchedVariant && qty >= matchedVariant.stockQuantity && (
                  <span className="text-[9px] text-error font-medium">
                    Max stock
                  </span>
                )}
              </div>

              <Button
                onClick={handlePerformQuickAdd}
                disabled={isAddingCart || !matchedVariant || matchedVariant.stockQuantity <= 0}
                className="w-full bg-accent text-background hover:bg-accent/90 font-sans text-[11px] font-semibold py-1.5 h-8 rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isAddingCart ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShoppingBag className="h-3.5 w-3.5" />
                )}
                Add
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Metadata Info */}
      <Link href={`/product/${id}`} className="mt-3 flex flex-col space-y-1 block cursor-pointer">
        <p className="font-sans text-[10px] uppercase tracking-widest text-brown-muted">
          {brand}
        </p>
        <h3 className="font-serif text-sm text-charcoal font-medium line-clamp-1 group-hover:text-accent transition-colors">
          {name}
        </h3>
        <div className="flex items-center gap-2 font-sans text-xs font-semibold">
          {isProductDiscounted ? (
            <>
              <span className="text-accent">{salePriceDisplay}</span>
              <span className="text-[10px] text-brown-muted line-through">{priceDisplay}</span>
            </>
          ) : (
            <span className="text-charcoal/80">{priceDisplay}</span>
          )}
        </div>
      </Link>
    </div>
  );
}
