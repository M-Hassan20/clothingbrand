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

export async function forgotPassword(email: string): Promise<void> {
  return apiPost<void>('/auth/forgot-password', { email });
}

export async function resetPassword(body: { email: string; otpCode: string; newPassword: string }): Promise<void> {
  return apiPost<void>('/auth/reset-password', body);
}
