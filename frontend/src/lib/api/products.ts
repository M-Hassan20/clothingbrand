import { ProductResponse, ProductDetailResponse, ProductVariantResponse } from '@/types/api';
import { apiGet } from './client';
import { MOCK_PRODUCTS } from './mockData';

export interface PageParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
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
    const data = await apiGet<ProductResponse[]>(`/products${query}`);
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn('Backend products fetch failed, using fallback mock data:', err);
  }
  return MOCK_PRODUCTS.map(toProductResponse);
}

export async function getProductById(id: number): Promise<ProductDetailResponse> {
  try {
    const data = await apiGet<ProductDetailResponse>(`/products/${id}`);
    if (data) return data;
  } catch (err) {
    console.warn(`Backend fetch for product ${id} failed, using fallback mock data:`, err);
  }
  const found = MOCK_PRODUCTS.find((p) => p.id === id);
  if (!found) throw new Error(`Product with ID ${id} not found`);
  return found;
}

export async function getProductsByCategory(
  categoryId: number,
  params?: PageParams
): Promise<ProductResponse[]> {
  try {
    const query = buildQueryString({ ...params });
    const data = await apiGet<ProductResponse[]>(`/products/category/${categoryId}${query}`);
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn('Backend products by category fetch failed, using fallback:', err);
  }
  return MOCK_PRODUCTS.filter((p) => p.category.id === categoryId).map(toProductResponse);
}

export async function searchProducts(
  queryText: string,
  params?: PageParams
): Promise<ProductResponse[]> {
  try {
    const query = buildQueryString({ query: queryText, ...params });
    const data = await apiGet<ProductResponse[]>(`/products/search${query}`);
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn('Backend search products fetch failed, using fallback:', err);
  }
  const q = queryText.toLowerCase();
  return MOCK_PRODUCTS.filter(
    (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
  ).map(toProductResponse);
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
    const data = await apiGet<ProductResponse[]>(`/products/filter${query}`);
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn('Backend filter products fetch failed, using fallback:', err);
  }
  
  let products = [...MOCK_PRODUCTS];
  
  if (params.categoryId) {
    products = products.filter((p) => p.category.id === params.categoryId);
  }
  if (params.brand) {
    products = products.filter((p) => p.brand.toLowerCase() === params.brand?.toLowerCase());
  }
  if (params.minPrice !== undefined) {
    products = products.filter((p) => p.minPrice >= (params.minPrice ?? 0));
  }
  if (params.maxPrice !== undefined) {
    products = products.filter((p) => p.minPrice <= (params.maxPrice ?? Infinity));
  }
  if (params.search) {
    const s = params.search.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
  }
  
  // Sort
  if (params.sortBy === 'price') {
    products.sort((a, b) => params.sortDir === 'DESC' ? b.minPrice - a.minPrice : a.minPrice - b.minPrice);
  } else {
    // Default by date
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return products.map(toProductResponse);
}

export async function getBestSellers(params?: PageParams): Promise<ProductResponse[]> {
  try {
    const query = buildQueryString({ ...params });
    const data = await apiGet<ProductResponse[]>(`/products/best-sellers${query}`);
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn('Backend best sellers fetch failed, using fallback:', err);
  }
  // Mock best sellers as first 3 items
  return MOCK_PRODUCTS.slice(0, 3).map(toProductResponse);
}

export async function getNewArrivals(params?: PageParams): Promise<ProductResponse[]> {
  try {
    const query = buildQueryString({ ...params });
    const data = await apiGet<ProductResponse[]>(`/products/new-arrivals${query}`);
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn('Backend new arrivals fetch failed, using fallback:', err);
  }
  // Mock new arrivals as last 3 items
  return MOCK_PRODUCTS.slice(2, 5).map(toProductResponse);
}

export async function getRelatedProducts(
  id: number,
  params?: PageParams
): Promise<ProductResponse[]> {
  try {
    const query = buildQueryString({ ...params });
    const data = await apiGet<ProductResponse[]>(`/products/${id}/related${query}`);
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn('Backend related products fetch failed, using fallback:', err);
  }
  const found = MOCK_PRODUCTS.find((p) => p.id === id);
  const categoryId = found?.category.id;
  return MOCK_PRODUCTS.filter((p) => p.id !== id && p.category.id === categoryId).map(toProductResponse);
}

export async function getProductVariants(id: number): Promise<ProductVariantResponse[]> {
  try {
    const data = await apiGet<ProductVariantResponse[]>(`/products/${id}/variants`);
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn('Backend variants fetch failed, using fallback:', err);
  }
  const found = MOCK_PRODUCTS.find((p) => p.id === id);
  return found?.variants || [];
}

export async function getProductSizes(id: number): Promise<string[]> {
  try {
    const data = await apiGet<string[]>(`/products/${id}/sizes`);
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn('Backend sizes fetch failed, using fallback:', err);
  }
  const found = MOCK_PRODUCTS.find((p) => p.id === id);
  return found?.availableSizes || [];
}

export async function getProductColors(id: number): Promise<string[]> {
  try {
    const data = await apiGet<string[]>(`/products/${id}/colors`);
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn('Backend colors fetch failed, using fallback:', err);
  }
  const found = MOCK_PRODUCTS.find((p) => p.id === id);
  return found?.availableColors || [];
}

export async function getBrands(): Promise<string[]> {
  try {
    const data = await apiGet<string[]>('/products/brands');
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn('Backend brands fetch failed, using fallback:', err);
  }
  return Array.from(new Set(MOCK_PRODUCTS.map((p) => p.brand)));
}
