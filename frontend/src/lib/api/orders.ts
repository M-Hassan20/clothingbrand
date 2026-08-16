import { OrderCreateRequest, OrderResponse, OrderItemResponse, GuestCheckoutRequest } from '@/types/api';
import { apiGet, apiPost, apiPatch, downloadInvoice as dlInvoice } from './client';

export async function createOrder(
  userId: string,
  body: OrderCreateRequest
): Promise<OrderResponse> {
  return apiPost<OrderResponse>(`/orders?userId=${encodeURIComponent(userId)}`, body);
}

export async function createGuestOrder(
  body: GuestCheckoutRequest
): Promise<OrderResponse> {
  return apiPost<OrderResponse>('/orders/guest', body);
}

interface PaginatedResponse<T> {
  content: T[];
}

export async function getOrders(
  userId: string,
  params?: { page?: number; size?: number }
): Promise<OrderResponse[]> {
  const query = new URLSearchParams();
  query.append('userId', userId);
  if (params?.page !== undefined) query.append('page', String(params.page));
  if (params?.size !== undefined) query.append('size', String(params.size));
  
  const res = await apiGet<PaginatedResponse<OrderResponse> | OrderResponse[]>(
    `/orders?${query.toString()}`
  );
  if (res && 'content' in res && Array.isArray(res.content)) {
    return res.content;
  }
  if (Array.isArray(res)) {
    return res;
  }
  return [];
}

export async function getOrderById(id: number): Promise<OrderResponse> {
  return apiGet<OrderResponse>(`/orders/${id}`);
}

export async function getOrderItems(id: number): Promise<OrderItemResponse[]> {
  return apiGet<OrderItemResponse[]>(`/orders/${id}/items`);
}

export async function cancelOrder(id: number, userId: string): Promise<OrderResponse> {
  return apiPatch<OrderResponse>(`/orders/${id}/cancel?userId=${encodeURIComponent(userId)}`);
}

export async function downloadOrderInvoice(orderId: number): Promise<Blob> {
  return dlInvoice(orderId);
}
