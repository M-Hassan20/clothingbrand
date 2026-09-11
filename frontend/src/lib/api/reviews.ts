import { ReviewResponse, ReviewStats, ReviewCreateRequest, GuestReviewRequest } from '@/types/api';
import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { MOCK_REVIEWS, MOCK_REVIEW_STATS } from './mockData';

export async function createGuestReview(
  body: GuestReviewRequest
): Promise<ReviewResponse> {
  return await apiPost<ReviewResponse>('/reviews/guest', body);
}

interface PaginatedResponse<T> {
  content: T[];
}

export async function getProductReviews(
  productId: number,
  params?: { page?: number; size?: number }
): Promise<ReviewResponse[]> {
  try {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.size !== undefined) query.append('size', String(params.size));
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    const data = await apiGet<PaginatedResponse<ReviewResponse> | ReviewResponse[]>(
      `/reviews/product/${productId}${queryStr}`
    );
    
    if (data && 'content' in data && Array.isArray(data.content)) {
      return data.content;
    } else if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn(`Backend reviews fetch for product ${productId} failed:`, err);
  }
  return [];
}

export async function getProductReviewStats(productId: number): Promise<ReviewStats> {
  try {
    const data = await apiGet<ReviewStats>(`/reviews/product/${productId}/stats`);
    if (data) return data;
  } catch (err) {
    console.warn(`Backend review stats fetch for product ${productId} failed:`, err);
  }
  return {
    averageRating: 0,
    reviewCount: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
}

export async function createReview(
  userId: string,
  body: ReviewCreateRequest
): Promise<ReviewResponse> {
  try {
    return await apiPost<ReviewResponse>(`/reviews?userId=${encodeURIComponent(userId)}`, body);
  } catch (err) {
    // If it's a backend validation error (e.g. status code present), throw it to show the error toast
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    
    console.warn('Backend create review failed (network issue), mock inserting locally:', err);
    // Simulate creation
    const newReview: ReviewResponse = {
      id: Math.floor(Math.random() * 100000),
      userId,
      userFullName: 'Guest Customer',
      productId: body.productId,
      rating: body.rating,
      comment: body.comment,
      createdAt: new Date().toISOString(),
    };
    if (!MOCK_REVIEWS[body.productId]) MOCK_REVIEWS[body.productId] = [];
    MOCK_REVIEWS[body.productId].unshift(newReview);
    
    // Update stats
    const stats = MOCK_REVIEW_STATS[body.productId] || {
      averageRating: 0,
      reviewCount: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
    stats.reviewCount += 1;
    const rKey = Math.round(body.rating) as 1|2|3|4|5;
    stats.ratingDistribution[rKey] = (stats.ratingDistribution[rKey] || 0) + 1;
    const totalSum = Object.entries(stats.ratingDistribution).reduce((acc, [rating, count]) => acc + (Number(rating) * Number(count)), 0);
    stats.averageRating = parseFloat((totalSum / stats.reviewCount).toFixed(1));
    MOCK_REVIEW_STATS[body.productId] = stats;

    return newReview;
  }
}

export async function updateReview(
  reviewId: number,
  userId: number | string,
  rating: number,
  comment: string
): Promise<ReviewResponse> {
  return await apiPut<ReviewResponse>(
    `/reviews/${reviewId}?userId=${userId}&rating=${rating}&comment=${encodeURIComponent(comment)}`
  );
}

export async function deleteReview(
  reviewId: number,
  userId: number | string
): Promise<void> {
  await apiDelete<void>(`/reviews/${reviewId}?userId=${userId}`);
}
