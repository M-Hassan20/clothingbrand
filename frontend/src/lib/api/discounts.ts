import { apiPost } from './client';
import { DiscountValidateResponse } from '@/types/api';

export async function validateDiscountCode(
  code: string,
  orderAmount: number
): Promise<DiscountValidateResponse> {
  const response = await apiPost<DiscountValidateResponse>('/discounts/validate', {
    code,
    orderAmount,
  });
  return response;
}
