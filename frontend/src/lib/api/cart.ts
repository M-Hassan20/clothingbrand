import { CartDTO } from '@/types/api';
import { apiDelete, apiGet, apiPost, apiPut } from './client';

export async function getCart(userId: string): Promise<CartDTO> {
  return apiGet<CartDTO>(`/cart?userId=${encodeURIComponent(userId)}`);
}

export async function addToCart(
  userId: string,
  productVariantId: number,
  quantity: number
): Promise<CartDTO> {
  return apiPost<CartDTO>(
    `/cart/add?userId=${encodeURIComponent(userId)}&productVariantId=${productVariantId}&quantity=${quantity}`
  );
}

export async function updateCartItem(
  userId: string,
  productVariantId: number,
  quantity: number
): Promise<CartDTO> {
  return apiPut<CartDTO>(
    `/cart/update?userId=${encodeURIComponent(userId)}&productVariantId=${productVariantId}&quantity=${quantity}`
  );
}

export async function removeCartItem(
  userId: string,
  productVariantId: number
): Promise<CartDTO> {
  return apiDelete<CartDTO>(
    `/cart/remove?userId=${encodeURIComponent(userId)}&productVariantId=${productVariantId}`
  );
}

export async function clearCart(userId: string): Promise<void> {
  return apiDelete<void>(`/cart/clear?userId=${encodeURIComponent(userId)}`);
}

export async function getCartCount(userId: string): Promise<number> {
  return apiGet<number>(`/cart/count?userId=${encodeURIComponent(userId)}`);
}
