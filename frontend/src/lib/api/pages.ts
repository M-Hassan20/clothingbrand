import { apiGet } from './client';

export interface PageConfigDTO {
  id?: number;
  pageKey: string;
  status: 'DRAFT' | 'PUBLISHED';
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  contentHtml?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  workingHours?: string;
  metaTitle?: string;
  metaDescription?: string;
  featuredProductIds?: number[];
  featuredProducts?: any[];
  isPreview?: boolean;
}

export async function getPageConfig(pageKey: string, previewToken?: string): Promise<PageConfigDTO> {
  const query = previewToken ? `?token=${encodeURIComponent(previewToken)}` : '';
  return apiGet<PageConfigDTO>(`/page-config/${pageKey}${query}`);
}
