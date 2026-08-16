'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getPublishedPosts } from '@/lib/api/blog';
import { BlogPostSummaryResponse } from '@/types/api';
import { Loader2, BookOpen, Calendar, User } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/image-loader';

export default function BlogListingPage() {
  const [posts, setPosts] = useState<BlogPostSummaryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        setLoading(true);
        const res = await getPublishedPosts({ page, size: 9 });
        setPosts(res.content || []);
        setTotalPages(res.totalPages || 0);
      } catch (error) {
        console.error('Failed to load blog posts:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, [page]);

  return (
    <div className="w-full bg-background min-h-[calc(100vh-4rem)] pb-20">
      {/* Editorial Header */}
      <section className="bg-beige/10 border-b border-border/40 py-16 text-center">
        <div className="mx-auto max-w-3xl px-4 space-y-4">
          <span className="font-sans text-[10px] font-bold tracking-widest text-accent uppercase">
            Journal
          </span>
          <h1 className="font-serif text-4xl text-charcoal tracking-wide md:text-5xl">
            The Editorial
          </h1>
          <p className="font-sans text-xs md:text-sm text-brown-muted max-w-xl mx-auto leading-relaxed">
            Discover styling inspiration, lookbooks, announcements, and the narratives that define our crafted designs.
          </p>
        </div>
      </section>

      {/* Blog Cards Grid */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 space-y-3 font-sans">
            <BookOpen className="h-10 w-10 text-accent/60 mx-auto" />
            <h2 className="text-base font-semibold text-charcoal">No Articles Yet</h2>
            <p className="text-xs text-brown-muted">Check back later for stories and updates.</p>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => {
                const publishDate = post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Recent';

                return (
                  <article
                    key={post.id}
                    className="flex flex-col bg-surface border border-border/45 rounded-md overflow-hidden hover:shadow-md transition duration-200 group"
                  >
                    {/* Cover Wrap */}
                    <Link href={`/blog/${post.slug}`} className="block relative aspect-[16/10] overflow-hidden">
                      {post.coverImageUrl ? (
                        <Image
                          src={getOptimizedImageUrl(post.coverImageUrl, 600)}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-103 transition duration-500 ease-out"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-beige/25 flex items-center justify-center text-xs text-brown-muted uppercase tracking-wider font-semibold">
                          Haus of Hafsah
                        </div>
                      )}
                    </Link>

                    {/* Meta & Excerpt */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="font-sans text-[9px] font-bold text-accent uppercase tracking-widest block">
                          {post.category || 'Collection'}
                        </span>
                        <Link href={`/blog/${post.slug}`}>
                          <h3 className="font-serif text-lg text-charcoal hover:text-accent font-medium tracking-wide leading-snug transition duration-150">
                            {post.title}
                          </h3>
                        </Link>
                        <p className="font-sans text-[11px] text-brown-muted leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>
                      </div>

                      {/* Author Info */}
                      <div className="flex items-center justify-between border-t border-border/30 pt-4 text-[10px] font-sans text-brown-muted">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-accent/80" />
                          <span>{publishDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-accent/80" />
                          <span>By {post.authorName || 'Hafsah'}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center border-t border-border/40 pt-8 font-sans text-xs text-brown-muted">
                <span>
                  Page {page + 1} of {totalPages}
                </span>
                <div className="flex gap-3">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 border border-border rounded-md hover:bg-beige/10 hover:text-charcoal transition disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 border border-border rounded-md hover:bg-beige/10 hover:text-charcoal transition disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
