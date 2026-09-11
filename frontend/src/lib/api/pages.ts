import { apiGet } from './client';
import { CarouselSlideDTO } from '@/components/home/HeroCarousel';
import { ProductResponse } from '@/types/api';

export interface PageConfigDTO {
  id?: number;
  pageKey: string;
  status: 'DRAFT' | 'PUBLISHED';
  heroType?: 'SPLIT' | 'CAROUSEL';
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  carouselIntervalSeconds?: number;
  slides?: CarouselSlideDTO[];
  contentHtml?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  workingHours?: string;
  metaTitle?: string;
  metaDescription?: string;
  featuredProductIds?: number[];
  featuredProducts?: ProductResponse[];
  isPreview?: boolean;
}

export async function getPageConfig(pageKey: string, previewToken?: string): Promise<PageConfigDTO> {
  const query = previewToken ? `?token=${encodeURIComponent(previewToken)}` : '';
  return apiGet<PageConfigDTO>(`/page-config/${pageKey}${query}`);
}
