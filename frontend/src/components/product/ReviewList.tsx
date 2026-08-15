'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { ReviewResponse, ReviewStats } from '@/types/api';
import { getProductReviews, getProductReviewStats, createReview } from '@/lib/api/reviews';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ReviewListProps {
  productId: number;
}

export default function ReviewList({ productId }: ReviewListProps) {
  const { userId, isAuthenticated } = useAuthStore();

  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const loadReviewsData = useCallback(async () => {
    try {
      setLoading(true);
      const [reviewList, reviewStats] = await Promise.all([
        getProductReviews(productId),
        getProductReviewStats(productId),
      ]);
      setReviews(reviewList);
      setStats(reviewStats);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviewsData();
  }, [loadReviewsData]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please enter a comment.');
      return;
    }

    setSubmitting(true);
    try {
      await createReview(userId || 'guest-user', {
        productId,
        rating,
        comment: comment.trim(),
      });
      toast.success('Thank you for your review!');
      setComment('');
      setRating(5);
      // Reload reviews and stats
      await loadReviewsData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <Star
        key={idx}
        className={`h-3.5 w-3.5 ${
          idx < count ? 'fill-accent text-accent' : 'text-border fill-beige/25'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10 space-x-2">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <span className="text-xs text-brown-muted">Loading reviews...</span>
      </div>
    );
  }

  const averageRating = stats?.averageRating || 0;
  const reviewCount = stats?.reviewCount || 0;
  const distribution = stats?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
      {/* Sidebar Stats Summary */}
      <div className="space-y-6">
        <h3 className="font-serif text-lg font-medium text-charcoal">Customer Reviews</h3>
        
        <div className="flex items-baseline gap-3">
          <span className="font-sans text-4xl font-bold text-charcoal">{averageRating.toFixed(1)}</span>
          <div className="space-y-1">
            <div className="flex gap-0.5">{renderStars(Math.round(averageRating))}</div>
            <p className="font-sans text-xs text-brown-muted">Based on {reviewCount} reviews</p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-2 pt-2">
          {([5, 4, 3, 2, 1] as const).map((r) => {
            const count = distribution[r] || 0;
            const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
            return (
              <div key={r} className="flex items-center gap-3 text-xs">
                <span className="font-sans text-brown-muted w-3 font-semibold">{r}★</span>
                <div className="h-2 w-full rounded-full bg-beige/35 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="font-sans text-brown-muted w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List & Write Review */}
      <div className="lg:col-span-2 space-y-10">
        {/* List */}
        <div className="space-y-6">
          <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-charcoal">
            Recent Feedback
          </h4>
          {reviews.length === 0 ? (
            <div className="py-6 text-center border border-dashed border-border/40 rounded-md bg-beige/10">
              <p className="font-sans text-xs text-brown-muted">
                No reviews yet for this product. Be the first to share your experience!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {reviews.map((review) => (
                <div key={review.id} className="py-5 first:pt-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-sans text-xs font-semibold text-charcoal">
                        {review.user?.fullName || review.userFullName || 'Anonymous Customer'}
                      </p>
                      <div className="flex gap-0.5 mt-1">{renderStars(review.rating)}</div>
                    </div>
                    <span className="font-sans text-[10px] text-brown-muted">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-3 font-sans text-xs leading-relaxed text-brown-muted">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Review Form */}
        <div className="border-t border-border pt-8 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h4 className="font-serif text-sm font-medium text-charcoal">
              Write a Review
            </h4>
          </div>

          {isAuthenticated ? (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Rating Selector */}
              <div>
                <label className="block font-sans text-xs font-semibold text-brown-muted uppercase tracking-wider">
                  Rating
                </label>
                <div className="flex gap-1.5 mt-1.5">
                  {([1, 2, 3, 4, 5] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRating(r)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          r <= rating ? 'fill-accent text-accent' : 'text-border fill-transparent'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div>
                <label className="block font-sans text-xs font-semibold text-brown-muted uppercase tracking-wider">
                  Your Review
                </label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about the fit, material feel, or overall styling..."
                  className="w-full mt-2 rounded-md border border-border bg-background px-3 py-2 text-xs text-charcoal placeholder-brown-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="bg-accent text-background hover:bg-accent/90 px-6 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                Submit Review
              </Button>
            </form>
          ) : (
            <div className="flex items-start gap-2.5 p-3.5 rounded-md bg-beige/20 border border-border/30">
              <AlertCircle className="h-4 w-4 text-brown-muted mt-0.5 shrink-0" />
              <p className="font-sans text-xs text-brown-muted">
                You must be{' '}
                <a href="/auth/login" className="text-accent underline font-semibold">
                  signed in
                </a>{' '}
                to leave a product review.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
