import React from 'react';

export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 font-sans">
      {/* Breadcrumb Skeleton */}
      <div className="h-4 w-48 bg-beige/40 rounded animate-pulse mb-8" />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start mb-16">
        {/* Left: Product Gallery Skeleton */}
        <div className="lg:col-span-7">
          <div className="aspect-[3/4] w-full rounded-md bg-beige/35 animate-pulse" />
          <div className="flex gap-3 mt-4 overflow-x-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] w-16 sm:w-20 rounded-md bg-beige/20 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Right: Info Panel Skeleton */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-3">
            <div className="h-3.5 w-24 bg-beige/45 rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-beige/45 rounded animate-pulse" />
            <div className="h-6 w-1/4 bg-beige/40 rounded animate-pulse" />
          </div>

          <div className="space-y-4 pt-6 border-t border-border/40">
            <div className="h-4 w-16 bg-beige/45 rounded animate-pulse" />
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-12 bg-beige/30 rounded animate-pulse" />
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-border/40">
            <div className="h-4 w-16 bg-beige/45 rounded animate-pulse" />
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-16 bg-beige/30 rounded animate-pulse" />
              ))}
            </div>
          </div>

          <div className="h-11 w-full bg-beige/45 rounded-md animate-pulse mt-8" />
        </div>
      </div>
    </div>
  );
}
