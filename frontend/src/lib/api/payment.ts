import { apiGet, apiPost } from './client';
import { PaymentResponse } from '@/types/api';

export interface SafePayCheckoutResponse {
  trackerToken: string;
  checkoutUrl: string;
}

export async function initiateSafePayCheckout(
  orderId: number,
  intent: string = 'CYBERSOURCE',
  guestToken?: string | null
): Promise<SafePayCheckoutResponse> {
  const options = guestToken ? {
    headers: {
      'Authorization': `Bearer ${guestToken}`
    }
  } : undefined;
  return apiPost<SafePayCheckoutResponse>(
    `/payments/initiate-safepay/${orderId}?intent=${encodeURIComponent(intent)}`,
    undefined,
    options
  );
}

export async function verifySafePayPayment(
  trackerToken: string,
  guestToken?: string | null
): Promise<PaymentResponse> {
  const options = guestToken ? {
    headers: {
      'Authorization': `Bearer ${guestToken}`
    }
  } : undefined;
  return apiGet<PaymentResponse>(
    `/payments/verify-safepay/${encodeURIComponent(trackerToken)}`,
    options
  );
}

export async function getPaymentByOrderId(orderId: number): Promise<PaymentResponse> {
  return apiGet<PaymentResponse>(`/payments/order/${orderId}`);
}
