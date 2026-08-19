import { ApiResponse } from '@/types/api';
import { useAuthStore } from '../stores/auth-store';

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8080/api`;
  }
  return 'http://localhost:8080/api';
};

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  
  // Set up default headers
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type') && !(options.body instanceof Blob) && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Retrieve token from Zustand Auth Store if it exists
  const token = useAuthStore.getState().token;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const config: RequestInit = {
    ...options,
    headers,
  };
  
  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    throw new ApiError(`Failed to fetch (${errorMsg}). Please verify the backend server is reachable at ${baseUrl}.`);
  }
  
  // If response is not OK and not JSON
  if (!response.ok) {
    let errorMessage = `HTTP error! Status: ${response.status}`;
    try {
      const errorJson = (await response.json()) as ApiResponse<unknown>;
      if (errorJson && errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // Not a JSON error, fall back to status text
      errorMessage = response.statusText || errorMessage;
    }

    if (response.status === 401 || response.status === 403) {
      useAuthStore.getState().clearAuth();
    }

    throw new ApiError(errorMessage, response.status);
  }
  
  const envelope = (await response.json()) as ApiResponse<T>;
  
  if (!envelope.success) {
    throw new ApiError(envelope.message || 'API request failed');
  }
  
  // If data is null but success is true, we cast it or return as T (which could be null)
  return envelope.data as T;
}

export async function apiGet<T>(path: string, options?: RequestInit): Promise<T> {
  return request<T>(path, { ...options, method: 'GET' });
}

export async function apiPost<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
  return request<T>(path, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
  return request<T>(path, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPatch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
  return request<T>(path, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T>(path: string, options?: RequestInit): Promise<T> {
  return request<T>(path, { ...options, method: 'DELETE' });
}

// Special handler for invoice download returning a Blob
export async function downloadInvoice(orderId: number): Promise<Blob> {
  const url = `${getBaseUrl()}/invoices/${orderId}/download`;
  const headers = new Headers();
  
  const token = useAuthStore.getState().token;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    throw new ApiError(`Failed to download invoice (${errorMsg}).`);
  }
  
  if (!response.ok) {
    throw new ApiError(`Failed to download invoice: ${response.statusText}`, response.status);
  }
  
  return response.blob();
}
