import { ProductResponse } from '@/types/api';
import { apiGet, apiPut, apiPatch } from './client';

export interface HomepageConfigResponse {
  heroTitle: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  featuredProducts: ProductResponse[];
  isPreview?: boolean;
  updatedAt?: string;
}

export interface HomepageConfigRequest {
  heroTitle: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  featuredProductIds: number[];
}

export async function getHomepageConfig(previewToken?: string): Promise<HomepageConfigResponse> {
  const url = previewToken
    ? `/homepage?previewToken=${encodeURIComponent(previewToken)}`
    : '/homepage';
  return apiGet<HomepageConfigResponse>(url, {
    next: { tags: ['homepage'], revalidate: 300 }
  });
}

export async function getAdminHomepageConfig(): Promise<HomepageConfigResponse> {
  return apiGet<HomepageConfigResponse>('/admin/homepage');
}

export async function updateAdminHomepageConfig(request: HomepageConfigRequest): Promise<HomepageConfigResponse> {
  return apiPut<HomepageConfigResponse>('/admin/homepage', request);
}

export async function publishHomepageConfig(): Promise<HomepageConfigResponse> {
  return apiPatch<HomepageConfigResponse>('/admin/homepage/publish');
}
