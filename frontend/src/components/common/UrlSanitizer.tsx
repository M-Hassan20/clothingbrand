'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SanitizerContent({ paramKey }: { paramKey: string }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.has(paramKey) && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete(paramKey);
      const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [searchParams, paramKey]);

  return null;
}

export default function UrlSanitizer({ paramKey = 'token' }: { paramKey?: string }) {
  return (
    <Suspense fallback={null}>
      <SanitizerContent paramKey={paramKey} />
    </Suspense>
  );
}
