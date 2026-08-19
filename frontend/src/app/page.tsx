import React from 'react';
import { getNewArrivals, getBestSellers } from '@/lib/api/products';
import { getHomepageConfig } from '@/lib/api/homepage';
import Hero from '@/components/home/Hero';
import CategoryTiles from '@/components/home/CategoryTiles';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import NewsletterSignup from '@/components/home/NewsletterSignup';

export const revalidate = 3600; // revalidate every hour

interface HomeProps {
  searchParams?: Promise<{ token?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const previewToken = resolvedSearchParams.token;

  let homepageConfig = null;
  try {
    homepageConfig = await getHomepageConfig(previewToken);
  } catch (err) {
    console.error('Failed to fetch homepage config, using defaults:', err);
  }

  const [newArrivals, bestSellers] = await Promise.all([
    getNewArrivals(),
    getBestSellers(),
  ]);

  return (
    <div className="flex flex-col w-full">
      {/* 1. Split Hero Section */}
      <Hero
        title={homepageConfig?.heroTitle}
        subtitle={homepageConfig?.heroSubtitle}
        imageUrl={homepageConfig?.heroImageUrl}
        ctaText={homepageConfig?.ctaText}
        ctaLink={homepageConfig?.ctaLink}
      />

      {/* 2. Category Tiles Section */}
      <CategoryTiles />

      {/* 3. New Arrivals, Best Sellers & Curated Featured Section */}
      <FeaturedProducts
        newArrivals={newArrivals}
        bestSellers={bestSellers}
        featuredProducts={homepageConfig?.featuredProducts}
      />

      {/* 4. Editorial Newsletter Section */}
      <NewsletterSignup />
    </div>
  );
}
