import React from 'react';

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6 mb-8">
        <div className="h-6 w-32 bg-beige/45 rounded animate-pulse" />
        <div className="h-9 w-40 bg-beige/45 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block space-y-6">
          <div className="h-5 w-24 bg-beige/45 rounded animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 w-full bg-beige/30 rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[3/4] w-full bg-beige/35 rounded-md animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-2/3 bg-beige/40 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-beige/30 rounded animate-pulse" />
                  <div className="h-4 w-1/4 bg-beige/45 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
