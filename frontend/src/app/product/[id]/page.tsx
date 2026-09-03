import { Metadata } from 'next';
import React from 'react';
import { getProductById, getCompleteTheLook } from '@/lib/api/products';
import ProductDetailClient from './ProductDetailClient';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const productId = parseInt(resolvedParams.id, 10);
  try {
    const product = await getProductById(productId);
    return {
      title: product.name,
      description: product.description || `Buy ${product.name} at Haus of Hafsah.`,
    };
  } catch {
    return {
      title: 'Product Details',
    };
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const productId = parseInt(resolvedParams.id, 10);

  // Fetch product detail and curated recommendation suggestions on the server
  const product = await getProductById(productId);
  const relatedProducts = await getCompleteTheLook(productId);

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
