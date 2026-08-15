'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Loader2 } from 'lucide-react';
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

interface ProductCardProps {
  product: ProductResponse;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { id, name, brand, minPrice, maxPrice, thumbnailImage } = product;

  const router = useRouter();
  const { userId: authUserId, isAuthenticated } = useAuthStore();
  const { setCart, getEffectiveUserId } = useCartStore();
  const { addWishlistVariantId, removeWishlistVariantId, hasItem } = useWishlistStore();

  const [variants, setVariants] = useState<ProductVariantResponse[]>([]);
  const [secondImage, setSecondImage] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingCart, setIsAddingCart] = useState(false);
  const [isAddingWishlist, setIsAddingWishlist] = useState(false);

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

  // Determine if product is wishlisted (check default variant)
  const defaultVariant = variants[0] || null;
  const isWishlisted = defaultVariant ? hasItem(defaultVariant.id) : false;

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to add items to your wishlist.');
      router.push('/auth/login');
      return;
    }

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
        await removeFromWishlist(userId, variantId);
        toast.success('Removed from wishlist');
      } else {
        // Optimistic update
        addWishlistVariantId(variantId);
        await addToWishlist(userId, variantId);
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

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!defaultVariant) {
      toast.error('Product loading, please try again.');
      return;
    }

    if (!defaultVariant.inStock) {
      toast.error('This variant is out of stock.');
      return;
    }

    try {
      setIsAddingCart(true);
      const updatedCart = await addToCart(userId, defaultVariant.id, 1);
      setCart(updatedCart);
      toast.success(`${name} added to bag`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add to cart';
      toast.error(msg);
    } finally {
      setIsAddingCart(false);
    }
  };

  // Render price tag
  const priceDisplay =
    minPrice === maxPrice
      ? `$${minPrice.toFixed(2)}`
      : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

  return (
    <Link href={`/product/${id}`} className="group relative block w-full">
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
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 shadow-xs text-charcoal backdrop-blur-xs hover:bg-background hover:scale-105 transition-all duration-200"
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

        {/* Product Image Wrapper */}
        <div className="relative h-full w-full overflow-hidden">
          {thumbnailImage ? (
            <Image
              src={isHovered && secondImage ? secondImage : thumbnailImage}
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

        {/* Quick Add To Cart Button - Slide up overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full md:group-hover:translate-y-0 transition-transform duration-300 ease-out bg-gradient-to-t from-charcoal/30 to-transparent">
          {defaultVariant?.inStock ? (
            <Button
              onClick={handleQuickAdd}
              disabled={isAddingCart}
              className="w-full bg-background/95 hover:bg-background text-charcoal hover:text-accent font-sans text-xs font-semibold py-2 rounded-md shadow-md border border-border/20 flex items-center justify-center gap-1.5"
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
        <div className="absolute bottom-2 right-2 md:hidden z-10">
          {defaultVariant?.inStock && (
            <button
              onClick={handleQuickAdd}
              disabled={isAddingCart}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-background shadow-lg hover:scale-105 transition-transform"
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
      </motion.div>

      {/* Metadata Info */}
      <div className="mt-3 flex flex-col space-y-1">
        <p className="font-sans text-[10px] uppercase tracking-widest text-brown-muted">
          {brand}
        </p>
        <h3 className="font-serif text-sm text-charcoal font-medium line-clamp-1 group-hover:text-accent transition-colors">
          {name}
        </h3>
        <p className="font-sans text-xs font-semibold text-charcoal/80">
          {priceDisplay}
        </p>
      </div>
    </Link>
  );
}
