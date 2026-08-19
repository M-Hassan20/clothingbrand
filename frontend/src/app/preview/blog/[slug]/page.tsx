'use client';

import BlogDetailPage from '../../../blog/[slug]/page';
import UrlSanitizer from '@/components/preview/UrlSanitizer';

export default function BlogPreviewPage() {
  return (
    <>
      <UrlSanitizer />
      <BlogDetailPage />
    </>
  );
}
