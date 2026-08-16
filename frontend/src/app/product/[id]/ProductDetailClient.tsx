'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Plus, Minus, Truck, RotateCcw, ShieldCheck, Loader2 } from 'lucide-react';
import { ProductDetailResponse, ProductResponse } from '@/types/api';
import ProductGallery from '@/components/product/ProductGallery';
import VariantSelector from '@/components/product/VariantSelector';
import dynamic from 'next/dynamic';

const ReviewList = dynamic(() => import('@/components/product/ReviewList'), {
  loading: () => (
    <div className="h-20 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
    </div>
  ),
  ssr: false,
});

import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addToCart } from '@/lib/api/cart';
import { addToWishlist, removeFromWishlist } from '@/lib/api/wishlist';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useCartStore } from '@/lib/stores/cart-store';
import { useWishlistStore } from '@/lib/stores/wishlist-store';
import { toast } from 'sonner';

interface ProductDetailClientProps {
  product: ProductDetailResponse;
  relatedProducts: ProductResponse[];
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const {
    id,
    name,
    description,
    brand,
    minPrice,
    thumbnailImage,
    averageRating,
    reviewCount,
    availableSizes,
    availableColors,
    variants,
  } = product;

  const router = useRouter();
  // Zustand State
  const { userId: authUserId, isAuthenticated } = useAuthStore();
  const { setCart, getEffectiveUserId } = useCartStore();
  const { addWishlistVariantId, removeWishlistVariantId, hasItem, addGuestWishlistItem } = useWishlistStore();

  const userId = getEffectiveUserId(authUserId);

  // Selection States
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [addingToCart, setAddingToCart] = useState<boolean>(false);
  const [updatingWishlist, setUpdatingWishlist] = useState<boolean>(false);

  // Automatically select the first in-stock variant on mount
  useEffect(() => {
    const firstInStock = variants.find((v) => v.stockQuantity > 0);
    if (firstInStock) {
      setSelectedSize(firstInStock.size);
      setSelectedColor(firstInStock.color);
    } else if (variants.length > 0) {
      setSelectedSize(variants[0].size);
      setSelectedColor(variants[0].color);
    }
  }, [variants]);

  // Find matching variant based on selections
  const currentVariant = variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  const isWishlisted = currentVariant ? hasItem(currentVariant.id) : false;

  const handleUpdateQty = (change: number) => {
    const nextVal = quantity + change;
    const maxStock = currentVariant ? currentVariant.stockQuantity : 99;
    if (nextVal >= 1 && nextVal <= maxStock) {
      setQuantity(nextVal);
    }
  };

  const handleToggleWishlist = async () => {
    if (!currentVariant) {
      toast.error('Please select size and color variants first');
      return;
    }

    setUpdatingWishlist(true);
    const variantId = currentVariant.id;
    try {
      if (isWishlisted) {
        removeWishlistVariantId(variantId);
        if (isAuthenticated) {
          await removeFromWishlist(userId, variantId);
        }
        toast.success('Removed from wishlist');
      } else {
        if (isAuthenticated) {
          addWishlistVariantId(variantId);
          await addToWishlist(userId, variantId);
        } else {
          addGuestWishlistItem({
            id: variantId,
            productVariant: {
              id: currentVariant.id,
              size: currentVariant.size,
              color: currentVariant.color,
              price: currentVariant.price,
              stockQuantity: currentVariant.stockQuantity,
              sku: currentVariant.sku,
              publicImageUrl: currentVariant.publicImageUrl || thumbnailImage || '',
              inStock: currentVariant.stockQuantity > 0,
            },
            productName: name,
            addedAt: new Date().toISOString(),
          });
        }
        toast.success('Added to wishlist');
      }
    } catch (err) {
      // Revert state
      if (isWishlisted) {
        addWishlistVariantId(variantId);
      } else {
        removeWishlistVariantId(variantId);
      }
      const msg = err instanceof Error ? err.message : 'Wishlist update failed';
      toast.error(msg);
    } finally {
      setUpdatingWishlist(false);
    }
  };

  const handleAddToCart = async () => {
    if (!currentVariant) {
      toast.error('Please select size and color variants first');
      return;
    }

    if (currentVariant.stockQuantity <= 0) {
      toast.error('This variant combination is currently out of stock.');
      return;
    }

    setAddingToCart(true);
    try {
      const updatedCart = await addToCart(userId, currentVariant.id, quantity);
      setCart(updatedCart);
      toast.success(`${name} added to bag`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add to cart';
      toast.error(msg);
    } finally {
      setAddingToCart(false);
    }
  };

  // Render price depending on selected variant or range
  const prices = variants.map((v) => v.price);
  const resolvedMinPrice = minPrice ?? (prices.length > 0 ? Math.min(...prices) : 0);
  const priceToDisplay = currentVariant ? currentVariant.price : resolvedMinPrice;
  const isOutOfStock = currentVariant 
    ? currentVariant.stockQuantity === 0 
    : (variants.length > 0 && variants.every((v) => v.stockQuantity === 0));
  const isLowStock = currentVariant ? currentVariant.stockQuantity > 0 && currentVariant.stockQuantity <= 3 : false;

  return (
    <div className="w-full bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8 font-sans text-xs text-brown-muted space-x-2">
          <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-charcoal transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-charcoal font-medium line-clamp-1">{name}</span>
        </nav>

        {/* Core Detail Layout */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start mb-16">
          {/* Left: Interactive Image Gallery */}
          <div className="lg:col-span-7">
            <ProductGallery
              defaultImage={thumbnailImage}
              variantImages={variants.map((v) => v.publicImageUrl).filter(Boolean)}
            />
          </div>

          {/* Right: Info Panel */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8">
            {/* Header info */}
            <div className="space-y-3">
              <span className="font-sans text-[10px] uppercase tracking-widest text-accent font-semibold">
                {brand}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-charcoal tracking-wide leading-tight">
                {name}
              </h1>
              
              {/* Rating summary */}
              {averageRating !== undefined && averageRating !== null && averageRating > 0 && (
                <div className="flex items-center gap-2 font-sans text-xs text-brown-muted">
                  <div className="flex text-accent">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span key={idx}>
                        {idx < Math.round(averageRating) ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span>({reviewCount} reviews)</span>
                </div>
              )}

              {/* Price */}
              <p className="font-sans text-xl font-bold text-charcoal pt-1">
                ${priceToDisplay.toFixed(2)}
              </p>
            </div>

            {/* Description Short */}
            <p className="font-sans text-xs sm:text-sm leading-relaxed text-brown-muted">
              {description}
            </p>

            {/* Variant Stepper Selection */}
            <VariantSelector
              variants={variants}
              availableSizes={availableSizes}
              availableColors={availableColors}
              selectedSize={selectedSize}
              selectedColor={selectedColor}
              onSelectSize={setSelectedSize}
              onSelectColor={setSelectedColor}
            />

            {/* Stock indicator */}
            {currentVariant && (
              <div className="font-sans text-xs">
                {isOutOfStock ? (
                  <span className="text-error font-semibold">Out of Stock</span>
                ) : isLowStock ? (
                  <span className="text-error font-semibold">Only {currentVariant.stockQuantity} left — order soon</span>
                ) : (
                  <span className="text-success font-semibold">In Stock & ready to ship</span>
                )}
              </div>
            )}

            {/* Cart Stepper & Add Actions */}
            {/* Cart Stepper & Add Actions */}
            <div className="flex gap-4">
              {isOutOfStock ? (
                <Button
                  disabled
                  className="flex-1 bg-beige/40 text-brown-muted py-3 rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed border border-border/20"
                >
                  Out of Stock
                </Button>
              ) : (
                <>
                  {/* Quantity counter */}
                  <div className="flex items-center border border-border rounded-md bg-beige/10">
                    <button
                      onClick={() => handleUpdateQty(-1)}
                      disabled={quantity <= 1}
                      className="p-3 text-brown-muted hover:text-charcoal disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3 text-sm font-sans font-semibold text-charcoal select-none min-w-[20px] text-center font-mono">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(1)}
                      disabled={currentVariant ? quantity >= currentVariant.stockQuantity : false}
                      className="p-3 text-brown-muted hover:text-charcoal disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Add to Cart CTA */}
                  <Button
                    onClick={handleAddToCart}
                    disabled={addingToCart || !currentVariant || quantity > (currentVariant?.stockQuantity || 0)}
                    className="flex-1 bg-accent text-background hover:bg-accent/90 py-3 rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-transform duration-200 active:scale-98 cursor-pointer"
                  >
                    {addingToCart ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingBag className="h-4 w-4" />
                    )}
                    Add to Bag
                  </Button>
                </>
              )}

              {/* Add to Wishlist Toggle */}
              <button
                onClick={handleToggleWishlist}
                disabled={updatingWishlist}
                className={`flex h-[46px] w-[46px] items-center justify-center rounded-md border transition-all cursor-pointer ${
                  isWishlisted
                    ? 'border-error/30 bg-error/5 text-error'
                    : 'border-border text-brown-muted hover:text-charcoal hover:border-charcoal'
                }`}
              >
                {updatingWishlist ? (
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                ) : (
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-error' : ''}`} />
                )}
                <span className="sr-only">Wishlist</span>
              </button>
            </div>

            {/* Premium details trustbadges */}
            <div className="border-t border-border/60 pt-6 space-y-3.5 font-sans text-xs text-brown-muted">
              <div className="flex items-center gap-3">
                <Truck className="h-4 w-4 text-accent" />
                <span>Complimentary signature packaging & free global delivery.</span>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="h-4 w-4 text-accent" />
                <span>14-day return exchange eligibility.</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <span>Secure checkouts with buyer assurance.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Below the Fold: Description and Reviews Tab lists */}
        <div className="border-t border-border pt-12 mb-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="flex border-b border-border bg-transparent w-full justify-start rounded-none h-auto p-0 gap-6">
              <TabsTrigger
                value="description"
                className="font-serif text-sm tracking-wide rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-charcoal text-brown-muted pb-3 bg-transparent p-0"
              >
                Product Details
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="font-serif text-sm tracking-wide rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-charcoal text-brown-muted pb-3 bg-transparent p-0"
              >
                Customer Reviews ({reviewCount})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="py-8 font-sans text-xs sm:text-sm leading-relaxed text-brown-muted max-w-3xl space-y-4">
              <p>{description}</p>
              <p>Designed with meticulous attention to detail, this piece encapsulates the signature Haus of Hafsah design language—fusing warm neutral hues, high-quality fabrication, and clean, modular silhouettes that seamlessly build into your seasonal capsule collection.</p>
              <ul className="list-disc list-inside space-y-1.5 pt-2 text-charcoal font-medium">
                <li>Premium boutique garment construction</li>
                <li>Consciously sourced raw natural fibres</li>
                <li>Finished with elegant hidden seam detail</li>
                <li>Made with care and designed for long-term wearability</li>
              </ul>
            </TabsContent>
            
            <TabsContent value="reviews" className="py-8">
              <ReviewList productId={id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-border pt-16">
            <h2 className="font-serif text-xl sm:text-2xl text-charcoal tracking-wide mb-10 text-center">
              Complete the Look
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedProducts.slice(0, 3).map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Sticky Bottom Bar on Mobile */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 flex items-center justify-between md:hidden shadow-lg">
        <div className="flex flex-col">
          <span className="font-sans text-[10px] text-brown-muted uppercase tracking-wider">Price</span>
          <span className="font-sans text-sm font-bold text-charcoal">${priceToDisplay.toFixed(2)}</span>
        </div>
        
        {isOutOfStock ? (
          <Button disabled className="bg-border text-brown-muted font-sans text-xs font-semibold py-2 px-6 rounded-md">
            Out of Stock
          </Button>
        ) : (
          <Button
            onClick={handleAddToCart}
            disabled={addingToCart || !currentVariant}
            className="bg-accent text-background hover:bg-accent/90 font-sans text-xs font-semibold py-2 px-6 rounded-md flex items-center gap-1.5"
          >
            {addingToCart ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShoppingBag className="h-3.5 w-3.5" />
            )}
            Add to Bag
          </Button>
        )}
      </div>
    </div>
  );
}
