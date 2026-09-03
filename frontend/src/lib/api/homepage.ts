import { apiGet } from './client';
import { PageConfigDTO } from './pages';

export async function getHomepageConfig(previewToken?: string): Promise<PageConfigDTO> {
  const query = previewToken ? `?token=${encodeURIComponent(previewToken)}` : '';
  return apiGet<PageConfigDTO>(`/page-config/HOMEPAGE${query}`, {
    next: { tags: ['homepage'], revalidate: 300 }
  });
}
