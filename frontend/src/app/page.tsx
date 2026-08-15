import React from 'react';
import { getNewArrivals, getBestSellers } from '@/lib/api/products';
import Hero from '@/components/home/Hero';
import CategoryTiles from '@/components/home/CategoryTiles';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import NewsletterSignup from '@/components/home/NewsletterSignup';

export const revalidate = 3600; // revalidate every hour

export default async function Home() {
  const [newArrivals, bestSellers] = await Promise.all([
    getNewArrivals(),
    getBestSellers(),
  ]);

  return (
    <div className="flex flex-col w-full">
      {/* 1. Split Hero Section */}
      <Hero />

      {/* 2. Category Tiles Section */}
      <CategoryTiles />

      {/* 3. New Arrivals & Best Sellers Section */}
      <FeaturedProducts newArrivals={newArrivals} bestSellers={bestSellers} />

      {/* 4. Editorial Newsletter Section */}
      <NewsletterSignup />
    </div>
  );
}
