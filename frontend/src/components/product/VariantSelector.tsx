'use client';

import React from 'react';
import { ProductVariantResponse } from '@/types/api';

interface VariantSelectorProps {
  variants: ProductVariantResponse[];
  availableSizes: string[];
  availableColors: string[];
  selectedSize: string | null;
  selectedColor: string | null;
  onSelectSize: (size: string) => void;
  onSelectColor: (color: string) => void;
}

export default function VariantSelector({
  variants,
  availableSizes,
  availableColors,
  selectedSize,
  selectedColor,
  onSelectSize,
  onSelectColor,
}: VariantSelectorProps) {
  
  // Helper to check if a size option is currently in stock (considering selectedColor if any)
  const isSizeAvailable = (size: string) => {
    if (selectedColor) {
      // Find variant with selectedColor and this size
      const variant = variants.find(
        (v) => v.color.toLowerCase() === selectedColor.toLowerCase() && v.size === size
      );
      return variant ? variant.stockQuantity > 0 : false;
    }
    // If no color selected, check if there is AT LEAST ONE in-stock variant with this size
    return variants.some((v) => v.size === size && v.stockQuantity > 0);
  };

  // Helper to check if a color option is currently in stock (considering selectedSize if any)
  const isColorAvailable = (color: string) => {
    if (selectedSize) {
      const variant = variants.find(
        (v) => v.size === selectedSize && v.color.toLowerCase() === color.toLowerCase()
      );
      return variant ? variant.stockQuantity > 0 : false;
    }
    return variants.some((v) => v.color.toLowerCase() === color.toLowerCase() && v.stockQuantity > 0);
  };

  return (
    <div className="space-y-6">
      {/* Colors Selection */}
      <div>
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-charcoal flex items-center justify-between">
          <span>Color: <span className="text-brown-muted font-normal capitalize">{selectedColor || 'Select color'}</span></span>
        </h3>
        <div className="flex flex-wrap gap-3 mt-3">
          {availableColors.map((color) => {
            const available = isColorAvailable(color);
            const isSelected = selectedColor?.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={color}
                onClick={() => available && onSelectColor(color)}
                className={`font-sans text-xs py-2 px-4 rounded-md border transition-all duration-200 ${
                  isSelected
                    ? 'border-accent bg-accent text-background font-medium'
                    : available
                    ? 'border-border text-charcoal hover:border-charcoal hover:bg-beige/10'
                    : 'border-border/30 text-brown-muted/40 cursor-not-allowed bg-beige/5 line-through'
                }`}
              >
                {color}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sizes Selection */}
      <div>
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-charcoal flex items-center justify-between">
          <span>Size: <span className="text-brown-muted font-normal uppercase">{selectedSize || 'Select size'}</span></span>
        </h3>
        <div className="flex flex-wrap gap-2.5 mt-3">
          {availableSizes.map((size) => {
            const available = isSizeAvailable(size);
            const isSelected = selectedSize === size;
            return (
              <button
                key={size}
                onClick={() => available && onSelectSize(size)}
                className={`font-sans text-xs min-w-[44px] h-[38px] flex items-center justify-center rounded-md border transition-all duration-200 ${
                  isSelected
                    ? 'border-accent bg-accent text-background font-medium'
                    : available
                    ? 'border-border text-charcoal hover:border-charcoal hover:bg-beige/10'
                    : 'border-border/30 text-brown-muted/40 cursor-not-allowed bg-beige/5 line-through'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
