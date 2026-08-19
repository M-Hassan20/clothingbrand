'use client';

import { useEffect } from 'react';

export default function UrlSanitizer() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('token=')) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  return null;
}
