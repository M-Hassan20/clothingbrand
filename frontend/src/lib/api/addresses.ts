import { AddressResponse, AddressCreateRequest } from '@/types/api';
import { apiDelete, apiGet, apiPost, apiPut, apiPatch } from './client';

export async function getAddresses(userId: string): Promise<AddressResponse[]> {
  return apiGet<AddressResponse[]>(`/addresses?userId=${encodeURIComponent(userId)}`);
}

export async function createAddress(
  userId: string,
  body: AddressCreateRequest
): Promise<AddressResponse> {
  return apiPost<AddressResponse>(`/addresses?userId=${encodeURIComponent(userId)}`, body);
}

export async function updateAddress(
  id: number,
  userId: string,
  body: AddressCreateRequest
): Promise<AddressResponse> {
  return apiPut<AddressResponse>(`/addresses/${id}?userId=${encodeURIComponent(userId)}`, body);
}

export async function setDefaultAddress(id: number, userId: string): Promise<AddressResponse> {
  return apiPatch<AddressResponse>(`/addresses/${id}/set-default?userId=${encodeURIComponent(userId)}`);
}

export async function deleteAddress(id: number, userId: string): Promise<void> {
  return apiDelete<void>(`/addresses/${id}?userId=${encodeURIComponent(userId)}`);
}
