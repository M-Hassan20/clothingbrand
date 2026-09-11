export interface AdminUser {
  userId: number;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'CUSTOMER';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8080/api`;
  }
  return 'http://localhost:8080/api';
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type') && !(options.body instanceof Blob) && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Get token from localStorage
  const token = localStorage.getItem('admin_token');
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
    throw new ApiError(`Failed to fetch (${errorMsg}). Please verify the backend server is reachable at ${baseUrl}.`, 0);
  }
  
  if (!response.ok) {
    let errorMessage = `HTTP error! Status: ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson) {
        if (typeof errorJson.message === 'string' && errorJson.message.trim()) {
          errorMessage = errorJson.message;
        } else if (Array.isArray(errorJson.errors) && errorJson.errors.length > 0) {
          errorMessage = errorJson.errors
            .map((e: any) => e.defaultMessage || e.message || (typeof e === 'string' ? e : JSON.stringify(e)))
            .join('; ');
        } else if (typeof errorJson.error === 'string' && errorJson.error.trim()) {
          errorMessage = errorJson.error;
        }
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    
    // Auto-logout on token expiration
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      // Redirect to login if not already there
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = '/login';
      }
    }
    
    throw new ApiError(errorMessage, response.status);
  }
  
  // Parse response
  const envelope = (await response.json()) as ApiResponse<T>;
  if (!envelope.success) {
    throw new ApiError(envelope.message || 'API request failed', response.status);
  }
  
  // Some APIs might return a success wrap with null data (e.g. DELETE)
  return envelope.data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'DELETE' }),
  download: async (path: string, fileName: string) => {
    const token = localStorage.getItem('admin_token');
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const response = await fetch(`${getBaseUrl()}${path}`, { method: 'GET', headers });
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
