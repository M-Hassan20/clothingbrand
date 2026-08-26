import { apiPost } from './client';

export async function submitContact(body: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  return apiPost<void>('/contact', body);
}
