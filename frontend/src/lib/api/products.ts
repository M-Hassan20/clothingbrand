import { ProductResponse, ProductDetailResponse, ProductVariantResponse } from '@/types/api';
import { apiGet } from './client';

export interface PageParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

// Spring Boot Page<T> response structure
interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

/**
 * Extracts the items array from a backend response that may be either:
 * - A Spring Page object with a `.content` array
 * - A plain array (for non-paginated endpoints)
 */
function extractItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'content' in data) {
    return (data as PageResponse<T>).content;
  }
  return [];
}

// Convert ProductDetailResponse to ProductResponse (omitting variants, etc.)
function toProductResponse(p: ProductDetailResponse): ProductResponse {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    brand: p.brand,
    category: p.category,
    minPrice: p.minPrice,
    maxPrice: p.maxPrice,
    thumbnailImage: p.thumbnailImage,
    averageRating: p.averageRating,
    reviewCount: p.reviewCount,
    isActive: p.isActive,
    createdAt: p.createdAt,
  };
}

export async function getProducts(params?: PageParams): Promise<ProductResponse[]> {
  try {
    const query = buildQueryString({
      page: 0,
      size: 12,
      sortBy: 'createdAt',
      sortDir: 'DESC',
      ...params,
    });
    const data = await apiGet<PageResponse<ProductResponse> | ProductResponse[]>(`/products${query}`, {
      next: { tags: ['products'], revalidate: 300 }
    });
    return extractItems<ProductResponse>(data);
  } catch (err) {
    console.warn('Backend products fetch failed:', err);
    return [];
  }
}

export async function getProductById(id: number): Promise<ProductDetailResponse> {
  try {
    const data = await apiGet<ProductDetailResponse>(`/products/${id}`, {
      next: { tags: ['products', `product-${id}`], revalidate: 300 }
    });
    if (data) return data;
  } catch (err) {
    console.warn(`Backend fetch for product ${id} failed:`, err);
  }
  throw new Error(`Product with ID ${id} not found`);
}

export async function getProductsByCategory(
  categoryId: number,
  params?: PageParams
): Promise<ProductResponse[]> {
  try {
    const query = buildQueryString({ ...params });
    const data = await apiGet<PageResponse<ProductResponse> | ProductResponse[]>(`/products/category/${categoryId}${query}`, {
      next: { tags: ['products'], revalidate: 300 }
    });
    return extractItems<ProductResponse>(data);
  } catch (err) {
    console.warn('Backend products by category fetch failed:', err);
    return [];
  }
}

export async function searchProducts(
  queryText: string,
  params?: PageParams
): Promise<ProductResponse[]> {
  try {
    const query = buildQueryString({ query: queryText, ...params });
    const data = await apiGet<PageResponse<ProductResponse> | ProductResponse[]>(`/products/search${query}`);
    return extractItems<ProductResponse>(data);
  } catch (err) {
    console.warn('Backend search products fetch failed:', err);
    return [];
  }
}

export interface FilterParams extends PageParams {
  categoryId?: number;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export async function filterProducts(params: FilterParams): Promise<ProductResponse[]> {
  try {
    const query = buildQueryString({ ...params });
    const data = await apiGet<PageResponse<ProductResponse> | ProductResponse[]>(`/products/filter${query}`);
    return extractItems<ProductResponse>(data);
  } catch (err) {
    console.warn('Backend filter products fetch failed:', err);
    return [];
  }
}

export async function getBestSellers(params?: PageParams): Promise<ProductResponse[]> {
  try {
    const query = buildQueryString({ ...params });
    const data = await apiGet<PageResponse<ProductResponse> | ProductResponse[]>(`/products/best-sellers${query}`, {
      next: { tags: ['products'], revalidate: 300 }
    });
    return extractItems<ProductResponse>(data);
  } catch (err) {
    console.warn('Backend best sellers fetch failed:', err);
    return [];
  }
}

export async function getNewArrivals(params?: PageParams): Promise<ProductResponse[]> {
  try {
    const query = buildQueryString({ ...params });
    const data = await apiGet<PageResponse<ProductResponse> | ProductResponse[]>(`/products/new-arrivals${query}`, {
      next: { tags: ['products'], revalidate: 300 }
    });
    return extractItems<ProductResponse>(data);
  } catch (err) {
    console.warn('Backend new arrivals fetch failed:', err);
    return [];
  }
}

export async function getRelatedProducts(
  id: number,
  params?: PageParams
): Promise<ProductResponse[]> {
  try {
    const query = buildQueryString({ ...params });
    const data = await apiGet<PageResponse<ProductResponse> | ProductResponse[]>(`/products/${id}/related${query}`, {
      next: { tags: ['products'], revalidate: 300 }
    });
    return extractItems<ProductResponse>(data);
  } catch (err) {
    console.warn('Backend related products fetch failed:', err);
    return [];
  }
}

export async function getCompleteTheLook(id: number): Promise<ProductResponse[]> {
  try {
    const data = await apiGet<ProductResponse[]>(`/products/${id}/complete-the-look`, {
      next: { tags: ['products', `product-${id}`], revalidate: 300 }
    });
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn('Backend complete-the-look fetch failed:', err);
  }
  return [];
}

export async function getProductVariants(id: number): Promise<ProductVariantResponse[]> {
  try {
    const data = await apiGet<ProductVariantResponse[]>(`/products/${id}/variants`, {
      next: { tags: ['products', `product-${id}`], revalidate: 300 }
    });
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn('Backend variants fetch failed:', err);
  }
  return [];
}

export async function getProductSizes(id: number): Promise<string[]> {
  try {
    const data = await apiGet<string[]>(`/products/${id}/sizes`);
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn('Backend sizes fetch failed:', err);
  }
  return [];
}

export async function getProductColors(id: number): Promise<string[]> {
  try {
    const data = await apiGet<string[]>(`/products/${id}/colors`);
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn('Backend colors fetch failed:', err);
  }
  return [];
}

export async function getBrands(): Promise<string[]> {
  try {
    const data = await apiGet<string[]>('/products/brands');
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn('Backend brands fetch failed:', err);
  }
  return [];
}
