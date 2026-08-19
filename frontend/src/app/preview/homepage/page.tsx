import React from 'react';
import Home from '../../page';
import UrlSanitizer from '@/components/preview/UrlSanitizer';

interface PreviewProps {
  searchParams?: Promise<{ token?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function HomepagePreviewPage({ searchParams }: PreviewProps) {
  return (
    <>
      <UrlSanitizer />
      <Home searchParams={searchParams} />
    </>
  );
}
