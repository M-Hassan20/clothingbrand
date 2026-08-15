import { CategoryResponse, CategoryWithProductsResponse, ProductDetailResponse } from '@/types/api';
import { apiGet } from './client';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from './mockData';

// Helper to convert ProductDetailResponse to ProductResponse
function toProductResponse(p: ProductDetailResponse) {
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

interface RawCategory {
  id: number;
  name: string;
  slug?: string;
  description?: string;
}

// Helper to dynamically enrich categories with slug and description if missing from backend
export function enrichCategory(cat: RawCategory): CategoryResponse {
  if (!cat) return cat;
  const name = cat.name || '';
  const slug = cat.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  let description = cat.description || 'Curated edits from the Haus of Hafsah collections';
  if (name.toLowerCase().includes('knitwear')) {
    description = 'Cozy cashmere and soft ribbed knits';
  } else if (name.toLowerCase().includes('outerwear')) {
    description = 'Tailored trench coats, jackets, and wrap coats';
  } else if (name.toLowerCase().includes('essential')) {
    description = 'Timeless basics for your everyday capsule wardrobe';
  } else if (name.toLowerCase().includes('new')) {
    description = 'Explore our latest seasonal edits';
  }
  
  return {
    id: cat.id,
    name: cat.name,
    slug,
    description,
  };
}

export async function getCategories(): Promise<CategoryResponse[]> {
  try {
    const data = await apiGet<CategoryResponse[]>('/categories');
    if (data && data.length > 0) {
      return data.map(enrichCategory);
    }
  } catch (err) {
    console.warn('Backend categories fetch failed, using fallback mock data:', err);
  }
  return MOCK_CATEGORIES;
}

export async function getCategoryById(id: number): Promise<CategoryResponse> {
  try {
    const data = await apiGet<CategoryResponse>(`/categories/${id}`);
    if (data) {
      return enrichCategory(data);
    }
  } catch (err) {
    console.warn(`Backend fetch for category ${id} failed, using fallback:`, err);
  }
  const found = MOCK_CATEGORIES.find((c) => c.id === id);
  if (!found) throw new Error(`Category ${id} not found`);
  return found;
}

export async function getCategoriesWithProducts(): Promise<CategoryWithProductsResponse[]> {
  try {
    const data = await apiGet<CategoryWithProductsResponse[]>('/categories/with-products');
    if (data && data.length > 0) {
      return data.map((cat) => ({
        ...enrichCategory(cat),
        products: cat.products || [],
      }));
    }
  } catch (err) {
    console.warn('Backend categories with products fetch failed, using fallback:', err);
  }
  return MOCK_CATEGORIES.map((cat) => ({
    ...cat,
    products: MOCK_PRODUCTS.filter((p) => p.category.id === cat.id).map(toProductResponse),
  }));
}
