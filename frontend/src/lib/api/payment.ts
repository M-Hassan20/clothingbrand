import { apiGet, apiPost } from './client';
import { PaymentResponse } from '@/types/api';

export interface SafePayCheckoutResponse {
  trackerToken: string;
  checkoutUrl: string;
}

export async function initiateSafePayCheckout(
  orderId: number,
  intent: string = 'CYBERSOURCE'
): Promise<SafePayCheckoutResponse> {
  return apiPost<SafePayCheckoutResponse>(`/payments/initiate-safepay/${orderId}?intent=${encodeURIComponent(intent)}`);
}

export async function verifySafePayPayment(trackerToken: string): Promise<PaymentResponse> {
  return apiGet<PaymentResponse>(`/payments/verify-safepay/${encodeURIComponent(trackerToken)}`);
}

export async function getPaymentByOrderId(orderId: number): Promise<PaymentResponse> {
  return apiGet<PaymentResponse>(`/payments/order/${orderId}`);
}
