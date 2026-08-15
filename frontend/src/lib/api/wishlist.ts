import { ProductResponse } from '@/types/api';
import { apiDelete, apiGet, apiPost } from './client';

export interface WishlistItemResponse {
  id: number;
  productVariant: {
    id: number;
    size: string;
    color: string;
    price: number;
    stockQuantity: number;
    sku: string;
    publicImageUrl: string;
    inStock: boolean;
  };
  productName: string;
  addedAt: string;
}

export async function getWishlist(userId: string): Promise<ProductResponse[]> {
  return apiGet<ProductResponse[]>(`/wishlist?userId=${encodeURIComponent(userId)}`);
}

export async function getWishlistItems(userId: string): Promise<WishlistItemResponse[]> {
  return apiGet<WishlistItemResponse[]>(`/wishlist/items?userId=${encodeURIComponent(userId)}`);
}

export async function addToWishlist(userId: string, productVariantId: number): Promise<void> {
  return apiPost<void>(
    `/wishlist/add?userId=${encodeURIComponent(userId)}&productVariantId=${productVariantId}`
  );
}

export async function removeFromWishlist(userId: string, productVariantId: number): Promise<void> {
  return apiDelete<void>(
    `/wishlist/remove?userId=${encodeURIComponent(userId)}&productVariantId=${productVariantId}`
  );
}

export async function checkWishlistStatus(userId: string, productVariantId: number): Promise<boolean> {
  return apiGet<boolean>(
    `/wishlist/check?userId=${encodeURIComponent(userId)}&productVariantId=${productVariantId}`
  );
}
