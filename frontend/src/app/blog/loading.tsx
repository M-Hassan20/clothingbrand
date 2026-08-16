import React from 'react';

export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 font-sans">
      <div className="text-center space-y-3 mb-16">
        <div className="h-4 w-20 bg-beige/45 rounded animate-pulse mx-auto" />
        <div className="h-10 w-64 bg-beige/45 rounded animate-pulse mx-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col bg-surface border border-border/45 rounded-md overflow-hidden p-6 space-y-4">
            <div className="aspect-[16/10] w-full bg-beige/35 rounded-md animate-pulse" />
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="h-3 w-16 bg-beige/30 rounded animate-pulse" />
                <div className="h-3 w-20 bg-beige/30 rounded animate-pulse" />
              </div>
              <div className="h-5 w-5/6 bg-beige/45 rounded animate-pulse" />
              <div className="h-4 w-full bg-beige/30 rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-beige/30 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
