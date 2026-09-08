'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { getPostBySlug } from '@/lib/api/blog';
import { BlogPostDetailResponse } from '@/types/api';
import { Loader2, ArrowLeft, Calendar, User, AlertCircle } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/image-loader';

export default function BlogDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const previewToken = searchParams.get('token') || undefined;

  const [post, setPost] = useState<BlogPostDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPost() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPostBySlug(slug, previewToken);
        setPost(data);
      } catch (err) {
        console.error('Failed to load blog post:', err);
        setError('Article not found or you do not have permission to preview.');
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadPost();
    }
  }, [slug, previewToken]);

  useEffect(() => {
    if (post?.title) {
      document.title = `${post.title} | Haus of Hafsah`;
    }
  }, [post]);

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-16">
        <div className="max-w-md px-4 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-error/80 mx-auto" />
          <h2 className="font-serif text-xl text-charcoal font-medium">Unable to Load Article</h2>
          <p className="font-sans text-xs text-brown-muted leading-relaxed">
            {error || 'This article could not be loaded.'}
          </p>
          <Link href="/blog" passHref>
            <button className="border border-border hover:bg-beige/10 px-5 py-2 text-xs font-semibold rounded-md text-charcoal cursor-pointer">
              Back to Editorial
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Draft Preview';

  return (
    <div className="w-full bg-background min-h-[calc(100vh-4rem)] pb-24">
      {/* Styles for embedded article HTML */}
      <style>{`
        .article-content {
          font-size: 15px;
          line-height: 1.8;
          color: #2b2622;
        }
        .article-content h2 {
          font-size: 1.6rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          font-family: 'Playfair Display', serif;
          color: #2b2622;
          letter-spacing: 0.02em;
        }
        .article-content h3 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-top: 1.75rem;
          margin-bottom: 0.5rem;
          font-family: 'Playfair Display', serif;
          color: #2b2622;
          letter-spacing: 0.02em;
        }
        .article-content p {
          margin-bottom: 1.5rem;
          text-align: justify;
        }
        .article-content ul {
          list-style-type: disc;
          padding-left: 1.75rem;
          margin-bottom: 1.5rem;
        }
        .article-content ol {
          list-style-type: decimal;
          padding-left: 1.75rem;
          margin-bottom: 1.5rem;
        }
        .article-content blockquote {
          border-left: 3px solid #b08968;
          padding-left: 1.25rem;
          font-style: italic;
          margin-bottom: 1.5rem;
          color: #8a7b6c;
          background-color: rgba(246, 240, 230, 0.35);
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
        }
        .article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 2rem auto;
          display: block;
        }
        .article-content a {
          color: #b08968;
          text-decoration: underline;
        }
      `}</style>

      {/* Preview Banner */}
      {post.isPreview && (
        <div className="w-full bg-accent/15 text-accent text-xs font-semibold px-4 py-3 text-center border-b border-accent/20 flex items-center justify-center gap-1.5 font-sans">
          <AlertCircle className="h-4.5 w-4.5" />
          <span>Preview Mode: You are viewing an unpublished draft of this post.</span>
        </div>
      )}

      {/* Article Container */}
      <article className="mx-auto max-w-3xl px-4 py-12">
        {/* Back Link */}
        <Link href="/blog" className="inline-flex items-center gap-1.5 font-sans text-xs text-brown-muted hover:text-charcoal transition duration-150 mb-8">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Editorial</span>
        </Link>

        {/* Header Metadata */}
        <header className="space-y-4 mb-8 text-center sm:text-left">
          <span className="font-sans text-[10px] font-bold text-accent uppercase tracking-widest block">
            {post.category || 'Lookbook'}
          </span>
          <h1 className="font-serif text-3xl text-charcoal tracking-wide md:text-4xl leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-sans text-brown-muted border-b border-border/40 pb-6 pt-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-accent/80" />
              <span>{publishDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-accent/80" />
              <span>By {post.authorName || 'Hafsah'}</span>
            </div>
          </div>
        </header>

        {/* Cover image */}
        {post.coverImageUrl && (
          <div className="relative aspect-[16/10] w-full rounded-md overflow-hidden border border-border/40 mb-10">
            <Image
              src={getOptimizedImageUrl(post.coverImageUrl, 1200)}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content Body */}
        <div
          className="article-content font-sans"
          dangerouslySetInnerHTML={{ __html: post.contentHtml || '' }}
        />
      </article>
    </div>
  );
}
