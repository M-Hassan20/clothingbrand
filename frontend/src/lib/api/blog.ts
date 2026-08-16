import { BlogPostSummaryResponse, BlogPostDetailResponse } from '@/types/api';
import { apiGet } from './client';

interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
}

export async function getPublishedPosts(params?: {
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<BlogPostSummaryResponse>> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.append('page', String(params.page));
  if (params?.size !== undefined) query.append('size', String(params.size));

  const path = `/blog?${query.toString()}`;
  return apiGet<PaginatedResponse<BlogPostSummaryResponse>>(path, {
    next: { tags: ['blog-posts'], revalidate: 300 }
  });
}

export async function getPostBySlug(
  slug: string,
  previewToken?: string
): Promise<BlogPostDetailResponse> {
  const query = new URLSearchParams();
  if (previewToken) query.append('previewToken', previewToken);

  const path = `/blog/${encodeURIComponent(slug)}?${query.toString()}`;
  return apiGet<BlogPostDetailResponse>(path, {
    cache: previewToken ? 'no-store' : 'default',
    next: previewToken ? undefined : { tags: ['blog-posts', `blog-${slug}`], revalidate: 300 }
  });
}
