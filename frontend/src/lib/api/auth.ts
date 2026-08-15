import { AuthResponse } from '@/types/api';
import { apiPost } from './client';

export async function login(body: Record<string, string>): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/login', body);
}

export async function register(body: Record<string, string>): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/register', body);
}

export async function loginWithFirebase(idToken: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/firebase', { idToken });
}
