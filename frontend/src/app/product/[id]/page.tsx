import React from 'react';
import { getProductById, getCompleteTheLook } from '@/lib/api/products';
import ProductDetailClient from './ProductDetailClient';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}
export const dynamic = 'force-dynamic';
export default async function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const productId = parseInt(resolvedParams.id, 10);

  // Fetch product detail and curated recommendation suggestions on the server
  const product = await getProductById(productId);
  const relatedProducts = await getCompleteTheLook(productId);

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
