import { CategoryResponse, CategoryWithProductsResponse, ProductDetailResponse } from '@/types/api';
import { apiGet } from './client';

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
    const data = await apiGet<CategoryResponse[]>('/categories', {
      next: { tags: ['categories'], revalidate: 300 }
    });
    if (Array.isArray(data)) {
      return data.map(enrichCategory);
    }
  } catch (err) {
    console.warn('Backend categories fetch failed:', err);
  }
  return [];
}

export async function getCategoryById(id: number): Promise<CategoryResponse> {
  try {
    const data = await apiGet<CategoryResponse>(`/categories/${id}`, {
      next: { tags: ['categories'], revalidate: 300 }
    });
    if (data) {
      return enrichCategory(data);
    }
  } catch (err) {
    console.warn(`Backend fetch for category ${id} failed:`, err);
  }
  throw new Error(`Category ${id} not found`);
}

export async function getCategoriesWithProducts(): Promise<CategoryWithProductsResponse[]> {
  try {
    const data = await apiGet<CategoryWithProductsResponse[]>('/categories/with-products', {
      next: { tags: ['categories', 'products'], revalidate: 300 }
    });
    if (Array.isArray(data)) {
      return data.map((cat) => ({
        ...enrichCategory(cat),
        products: cat.products || [],
      }));
    }
  } catch (err) {
    console.warn('Backend categories with products fetch failed:', err);
  }
  return [];
}
