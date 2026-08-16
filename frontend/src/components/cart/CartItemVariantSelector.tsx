'use client';

import React, { useState, useEffect } from 'react';
import { getProductVariants } from '@/lib/api/products';
import { ProductVariantResponse } from '@/types/api';
import { Loader2 } from 'lucide-react';

interface CartItemVariantSelectorProps {
  productId: number;
  currentVariantId: number;
  currentVariantName: string; // e.g. "M / Camel"
  quantity: number;
  onVariantChange: (oldVariantId: number, newVariantId: number) => Promise<void>;
}

export default function CartItemVariantSelector({
  productId,
  currentVariantId,
  currentVariantName,
  quantity,
  onVariantChange,
}: CartItemVariantSelectorProps) {
  const [variants, setVariants] = useState<ProductVariantResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Parse current size and color
  const parts = currentVariantName.split(' / ');
  const [initialSize, initialColor] = parts.length === 2 ? parts : [currentVariantName, ''];

  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [stockStatus, setStockStatus] = useState<'in_stock' | 'out_of_stock' | 'not_found'>('in_stock');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch product variants on mount
  useEffect(() => {
    let active = true;
    const fetchVariants = async () => {
      setLoading(true);
      try {
        const data = await getProductVariants(productId);
        if (active) {
          setVariants(data);
        }
      } catch (err) {
        console.error('Error fetching variants in CartItemVariantSelector:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchVariants();
    return () => {
      active = false;
    };
  }, [productId]);

  // Extract unique sizes and colors
  const sizes = Array.from(new Set(variants.map((v) => v.size))).filter(Boolean);
  const colors = Array.from(new Set(variants.map((v) => v.color))).filter(Boolean);

  // Watch size/color changes and check stock or trigger update
  useEffect(() => {
    if (variants.length === 0) return;

    const matched = variants.find(
      (v) =>
        v.size.toLowerCase() === selectedSize.toLowerCase() &&
        v.color.toLowerCase() === selectedColor.toLowerCase()
    );

    if (!matched) {
      setStockStatus('not_found');
      return;
    }

    if (matched.stockQuantity <= 0) {
      setStockStatus('out_of_stock');
    } else {
      setStockStatus('in_stock');
      // If it is different from the current variant, trigger update!
      if (matched.id !== currentVariantId) {
        const performChange = async () => {
          setIsUpdating(true);
          try {
            await onVariantChange(currentVariantId, matched.id);
          } catch (err) {
            // Revert state on error
            setSelectedSize(initialSize);
            setSelectedColor(initialColor);
          } finally {
            setIsUpdating(false);
          }
        };
        performChange();
      }
    }
  }, [selectedSize, selectedColor, variants]);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 py-1 text-[10px] text-brown-muted">
        <Loader2 className="h-3 w-3 animate-spin text-accent" />
        Loading options...
      </div>
    );
  }

  return (
    <div className="mt-1.5 flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {/* Size Selector */}
        {sizes.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-brown-muted font-sans font-medium">Size:</span>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              disabled={isUpdating}
              className="bg-beige/10 hover:bg-beige/25 border border-border/60 rounded px-1.5 py-0.5 text-[10px] font-sans font-semibold text-charcoal outline-none focus:border-accent cursor-pointer transition-colors"
            >
              {sizes.map((sz) => (
                <option key={sz} value={sz} className="bg-background text-charcoal">
                  {sz}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Color Selector */}
        {colors.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-brown-muted font-sans font-medium">Color:</span>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              disabled={isUpdating}
              className="bg-beige/10 hover:bg-beige/25 border border-border/60 rounded px-1.5 py-0.5 text-[10px] font-sans font-semibold text-charcoal outline-none focus:border-accent cursor-pointer transition-colors"
            >
              {colors.map((cl) => (
                <option key={cl} value={cl} className="bg-background text-charcoal">
                  {cl}
                </option>
              ))}
            </select>
          </div>
        )}

        {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-accent" />}
      </div>

      {/* Stock warning messages */}
      {stockStatus === 'out_of_stock' && (
        <span className="text-[10px] text-error font-medium animate-pulse">
          This option is out of stock
        </span>
      )}
      {stockStatus === 'not_found' && (
        <span className="text-[10px] text-error font-medium">
          Option combination unavailable
        </span>
      )}
    </div>
  );
}
