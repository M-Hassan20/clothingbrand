'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  AlertCircle,
  Sparkles,
  Loader2,
  Edit2,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { ReviewResponse, ReviewStats } from '@/types/api';
import {
  getProductReviews,
  getProductReviewStats,
  createReview,
  updateReview,
  deleteReview,
  createGuestReview,
} from '@/lib/api/reviews';
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

  // Write Mode
  const [writeMode, setWriteMode] = useState<'user' | 'guest'>('user');

  // Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Inline Editing States
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [updatingReviewId, setUpdatingReviewId] = useState<number | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);

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

    if (writeMode === 'guest' && !guestEmail.trim()) {
      toast.error('Please enter the email associated with your purchase.');
      return;
    }

    setSubmitting(true);
    try {
      if (writeMode === 'guest') {
        await createGuestReview({
          productId,
          guestEmail: guestEmail.trim(),
          rating,
          comment: comment.trim(),
        });
      } else {
        await createReview(userId || 'guest-user', {
          productId,
          rating,
          comment: comment.trim(),
        });
      }
      toast.success('Thank you for your review!');
      setComment('');
      setGuestEmail('');
      setRating(5);
      await loadReviewsData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStart = (review: ReviewResponse) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleEditCancel = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment('');
  };

  const handleEditSave = async (reviewId: number) => {
    if (!editComment.trim()) {
      toast.error('Review comment cannot be empty.');
      return;
    }

    setUpdatingReviewId(reviewId);
    try {
      await updateReview(reviewId, userId!, editRating, editComment.trim());
      toast.success('Review updated successfully!');
      setEditingReviewId(null);
      await loadReviewsData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update review';
      toast.error(msg);
    } finally {
      setUpdatingReviewId(null);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete your review?')) {
      return;
    }

    setDeletingReviewId(reviewId);
    try {
      await deleteReview(reviewId, userId!);
      toast.success('Review deleted successfully!');
      await loadReviewsData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete review';
      toast.error(msg);
    } finally {
      setDeletingReviewId(null);
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
              {reviews.map((review) => {
                const isOwner = userId && (String(review.user?.id) === String(userId) || review.userId === String(userId));
                const isEditing = editingReviewId === review.id;

                return (
                  <div key={review.id} className="py-5 first:pt-0 space-y-3">
                    {isEditing ? (
                      <div className="space-y-3 bg-beige/10 p-4 rounded-md border border-border/45 font-sans">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-charcoal">Editing Your Review</span>
                          <div className="flex gap-3">
                            <button
                              onClick={handleEditCancel}
                              className="text-brown-muted hover:text-charcoal text-xs flex items-center gap-1 cursor-pointer"
                              disabled={updatingReviewId !== null}
                            >
                              <X className="h-3.5 w-3.5" /> Cancel
                            </button>
                            <button
                              onClick={() => handleEditSave(review.id)}
                              className="text-accent hover:text-accent/90 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              disabled={updatingReviewId !== null}
                            >
                              {updatingReviewId === review.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Save
                            </button>
                          </div>
                        </div>

                        {/* Edit Rating Selection */}
                        <div className="flex gap-1">
                          {([1, 2, 3, 4, 5] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setEditRating(r)}
                              className="p-0.5 hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`h-4.5 w-4.5 ${
                                  r <= editRating ? 'fill-accent text-accent' : 'text-border fill-transparent'
                                }`}
                              />
                            </button>
                          ))}
                        </div>

                        {/* Edit Comment Textarea */}
                        <textarea
                          rows={3}
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-charcoal placeholder-brown-muted focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-sans text-xs font-semibold text-charcoal">
                                {review.user?.fullName || review.userFullName || 'Anonymous Customer'}
                              </p>
                              {review.isVerifiedPurchase && (
                                <span className="inline-flex items-center text-[9px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Verified Purchase
                                </span>
                              )}
                            </div>
                            <div className="flex gap-0.5 mt-1">{renderStars(review.rating)}</div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-sans text-[10px] text-brown-muted">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                            {isOwner && (
                              <div className="flex items-center gap-2 border-l border-border/50 pl-3">
                                <button
                                  onClick={() => handleEditStart(review)}
                                  className="text-brown-muted hover:text-charcoal transition p-1 cursor-pointer"
                                  title="Edit Review"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(review.id)}
                                  className="text-brown-muted hover:text-error transition p-1 cursor-pointer"
                                  disabled={deletingReviewId === review.id}
                                  title="Delete Review"
                                >
                                  {deletingReviewId === review.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="mt-2 font-sans text-xs leading-relaxed text-brown-muted">
                          {review.comment}
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
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

          {/* Mode Selector for Guests */}
          {!isAuthenticated && (
            <div className="flex gap-4 border-b border-border/40 pb-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => setWriteMode('user')}
                className={`pb-1 border-b-2 font-semibold uppercase tracking-wider text-[10px] transition cursor-pointer ${
                  writeMode === 'user'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-brown-muted hover:text-charcoal'
                }`}
              >
                Sign In to Review
              </button>
              <button
                type="button"
                onClick={() => setWriteMode('guest')}
                className={`pb-1 border-b-2 font-semibold uppercase tracking-wider text-[10px] transition cursor-pointer ${
                  writeMode === 'guest'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-brown-muted hover:text-charcoal'
                }`}
              >
                Review as Guest
              </button>
            </div>
          )}

          {(isAuthenticated || writeMode === 'guest') ? (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Email Address for Guests */}
              {writeMode === 'guest' && !isAuthenticated && (
                <div>
                  <label className="block font-sans text-[10px] font-bold text-brown-muted uppercase tracking-wider">
                    Checkout Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter the email address you used at checkout..."
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full mt-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs text-charcoal placeholder-brown-muted/70 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <span className="text-[10px] text-brown-muted mt-1 block">
                    We will verify your purchase status using this email address.
                  </span>
                </div>
              )}

              {/* Rating Selector */}
              <div>
                <label className="block font-sans text-[10px] font-bold text-brown-muted uppercase tracking-wider">
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
                <label className="block font-sans text-[10px] font-bold text-brown-muted uppercase tracking-wider">
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
                className="bg-accent text-background hover:bg-accent/90 px-6 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                to leave a product review. You can also write a guest review if you checked out as a guest.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
