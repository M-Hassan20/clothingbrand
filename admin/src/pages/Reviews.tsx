import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/error';
import {
  Star,
  Search,
  Filter,
  Trash2,
  Eye,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  ShoppingBag,
  RefreshCw,
  MessageSquareQuote,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserInfo {
  id: number;
  fullName: string;
  email: string;
}

interface Review {
  id: number;
  user: UserInfo;
  productId: number;
  productName: string;
  productThumbnailImage?: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  verifiedCount: number;
}

interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export default function Reviews() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = 'Product Reviews | Haus of Hafsah Admin';
  }, []);

  // Filters State derived from URL searchParams
  const searchParam = searchParams.get('search') || '';
  const ratingParam = searchParams.get('rating') || '';
  const verifiedParam = searchParams.get('verified') || '';
  const productParam = searchParams.get('productId') || '';
  const datePresetParam = searchParams.get('datePreset') || 'any';
  const startDateParam = searchParams.get('startDate') || '';
  const endDateParam = searchParams.get('endDate') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '0', 10);
  const sizeParam = parseInt(searchParams.get('size') || '10', 10);

  // Local state for debounced search
  const [searchInput, setSearchInput] = useState(searchParam);
  
  // Data States
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modals state
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search input -> URL searchParams update
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== searchParam) {
        updateFilter('search', searchInput);
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Keep searchInput in sync if URL parameter is cleared externally
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // Helper to update query params safely
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 0 whenever a filter changes (except if setting page/size itself)
    if (key !== 'page') {
      params.set('page', '0');
    }
    setSearchParams(params);
  };

  // Helper to clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  // Calculate ISO dates for preset date filters
  const getDateRangeForPreset = (preset: string) => {
    if (preset === 'custom') {
      return {
        start: startDateParam ? `${startDateParam}T00:00:00` : '',
        end: endDateParam ? `${endDateParam}T23:59:59` : '',
      };
    }

    const now = new Date();
    let start = new Date();

    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case '7days':
        start.setDate(now.getDate() - 7);
        break;
      case '30days':
        start.setDate(now.getDate() - 30);
        break;
      case '3months':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'thisyear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return { start: '', end: '' };
    }

    return {
      start: start.toISOString().slice(0, 19),
      end: now.toISOString().slice(0, 19),
    };
  };

  // Fetch Review Statistics
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get<ReviewStats>('/admin/reviews/stats');
      if (res) {
        setStats(res);
      }
    } catch (err) {
      console.error('Failed to load review statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Filtered Reviews
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchParam) params.append('search', searchParam);
      if (ratingParam) params.append('rating', ratingParam);
      if (verifiedParam) params.append('verified', verifiedParam);
      if (productParam) params.append('productId', productParam);
      
      const { start, end } = getDateRangeForPreset(datePresetParam);
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);

      params.append('sort', sortParam);
      params.append('page', pageParam.toString());
      params.append('size', sizeParam.toString());

      const res = await api.get<PaginatedResponse<Review>>(`/admin/reviews?${params.toString()}`);
      if (res && 'content' in res) {
        setReviews(res.content || []);
        setTotalPages(res.totalPages || 0);
        setTotalElements(res.totalElements || 0);
      } else if (Array.isArray(res)) {
        setReviews(res);
        setTotalPages(1);
        setTotalElements((res as Review[]).length);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load reviews'));
    } finally {
      setLoading(false);
    }
  }, [
    searchParam,
    ratingParam,
    verifiedParam,
    productParam,
    datePresetParam,
    startDateParam,
    endDateParam,
    sortParam,
    pageParam,
    sizeParam,
  ]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle Review Removal
  const handleRemoveReview = async () => {
    if (!deletingReview) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/reviews/${deletingReview.id}`);
      toast.success('Review removed successfully');
      setDeletingReview(null);
      if (selectedReview?.id === deletingReview.id) {
        setSelectedReview(null);
      }
      fetchReviews();
      fetchStats();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove review'));
    } finally {
      setDeleting(false);
    }
  };

  // Helper to render Star Ratings
  const renderStars = (rating: number, size = 'sm') => {
    const starClass = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starClass} ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-border/40 text-border'
            }`}
          />
        ))}
      </div>
    );
  };

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const hasActiveFilters =
    searchParam ||
    ratingParam ||
    verifiedParam ||
    productParam ||
    datePresetParam !== 'any' ||
    sortParam !== 'newest';

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-text-primary">
          Customer Reviews
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Manage, filter, and monitor customer feedback and ratings across your store.
        </p>
      </div>

      {/* Summary / Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Reviews */}
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs uppercase tracking-wider font-semibold">
              Total Reviews
            </span>
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            {statsLoading ? (
              <div className="h-8 w-20 bg-border/40 animate-pulse rounded" />
            ) : (
              <span className="text-3xl font-bold text-text-primary">
                {stats?.totalReviews?.toLocaleString() || 0}
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Average Rating */}
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs uppercase tracking-wider font-semibold">
              Average Rating
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Star className="w-5 h-5 fill-amber-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            {statsLoading ? (
              <div className="h-8 w-24 bg-border/40 animate-pulse rounded" />
            ) : (
              <>
                <span className="text-3xl font-bold text-text-primary">
                  {stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                </span>
                <div className="flex items-center text-amber-400">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 3: 5-Star Reviews */}
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs uppercase tracking-wider font-semibold">
              5-Star Reviews
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            {statsLoading ? (
              <div className="h-8 w-20 bg-border/40 animate-pulse rounded" />
            ) : (
              <span className="text-3xl font-bold text-text-primary">
                {stats?.fiveStarCount?.toLocaleString() || 0}
              </span>
            )}
          </div>
        </div>

        {/* Card 4: 1-Star Reviews */}
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs uppercase tracking-wider font-semibold">
              1-Star Reviews
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            {statsLoading ? (
              <div className="h-8 w-20 bg-border/40 animate-pulse rounded" />
            ) : (
              <span className="text-3xl font-bold text-rose-600">
                {stats?.oneStarCount?.toLocaleString() || 0}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-surface p-5 rounded-xl border border-border space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search reviews, comments, customer names, emails, or products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Refresh */}
          <button
            onClick={() => {
              fetchReviews();
              fetchStats();
            }}
            className="flex items-center justify-center px-4 py-2.5 bg-background hover:bg-border/30 border border-border rounded-lg text-sm text-text-primary transition-colors"
            title="Refresh review list"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
          {/* Rating Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Rating
            </label>
            <select
              value={ratingParam}
              onChange={(e) => updateFilter('rating', e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">All ratings</option>
              <option value="5">★★★★★ 5 Stars</option>
              <option value="4">★★★★☆ 4 Stars</option>
              <option value="3">★★★☆☆ 3 Stars</option>
              <option value="2">★★☆☆☆ 2 Stars</option>
              <option value="1">★☆☆☆☆ 1 Star</option>
            </select>
          </div>

          {/* Verified Purchase Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Verified Status
            </label>
            <select
              value={verifiedParam}
              onChange={(e) => updateFilter('verified', e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">All reviews</option>
              <option value="true">✓ Verified purchase</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Timeframe
            </label>
            <select
              value={datePresetParam}
              onChange={(e) => updateFilter('datePreset', e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="any">Any time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="3months">Last 3 months</option>
              <option value="thisyear">This year</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {/* Sorting Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Sort By
            </label>
            <select
              value={sortParam}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="rating_high">Highest rating</option>
              <option value="rating_low">Lowest rating</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="w-full py-2 px-3 bg-error/10 hover:bg-error/20 text-error text-sm font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-1.5" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Pickers (when datePresetParam === 'custom') */}
        {datePresetParam === 'custom' && (
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDateParam}
                onChange={(e) => updateFilter('startDate', e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDateParam}
                onChange={(e) => updateFilter('endDate', e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* Reviews Data Table Container */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-medium text-text-secondary">
            Showing <span className="text-text-primary font-bold">{reviews.length}</span> of{' '}
            <span className="text-text-primary font-bold">{totalElements}</span> reviews
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-text-secondary">Rows per page:</span>
            <select
              value={sizeParam}
              onChange={(e) => updateFilter('size', e.target.value)}
              className="bg-background border border-border rounded px-2 py-1 text-xs text-text-primary"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background border-b border-border text-xs uppercase tracking-wider text-text-secondary font-semibold">
              <tr>
                <th className="py-3.5 px-4">Rating & Review</th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4 text-center">Verified</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4 space-y-2">
                      <div className="h-4 w-24 bg-border/40 rounded" />
                      <div className="h-4 w-64 bg-border/30 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-32 bg-border/40 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-28 bg-border/40 rounded" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-4 w-16 bg-border/40 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-24 bg-border/40 rounded" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-6 w-16 bg-border/40 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : reviews.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-border/20 flex items-center justify-center text-text-secondary">
                        <MessageSquareQuote className="w-6 h-6" />
                      </div>
                      <h3 className="font-serif text-lg font-bold text-text-primary">
                        No reviews found
                      </h3>
                      <p className="text-xs text-text-secondary">
                        {hasActiveFilters
                          ? 'No customer reviews match your active search or filters. Try clearing your filters.'
                          : 'Customer feedback and ratings will appear here once submitted.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleClearFilters}
                          className="mt-2 px-4 py-2 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-accent/90 transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                // Data Rows
                reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="hover:bg-border/10 transition-colors group"
                  >
                    {/* Review Snippet */}
                    <td className="py-4 px-4 max-w-md">
                      <div className="space-y-1.5">
                        {renderStars(review.rating)}
                        <p className="text-xs text-text-primary line-clamp-2 leading-relaxed">
                          "{review.comment || 'No comment provided.'}"
                        </p>
                      </div>
                    </td>

                    {/* Product Info */}
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        {review.productThumbnailImage ? (
                          <img
                            src={review.productThumbnailImage}
                            alt={review.productName}
                            className="w-9 h-9 rounded object-cover border border-border flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded bg-border/20 flex items-center justify-center text-text-secondary flex-shrink-0">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        )}
                        <span className="text-xs font-medium text-text-primary line-clamp-2">
                          {review.productName || `Product #${review.productId}`}
                        </span>
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-text-primary">
                          {review.user?.fullName || 'Guest Customer'}
                        </div>
                        <div className="text-[11px] text-text-secondary truncate max-w-[160px]">
                          {review.user?.email || 'N/A'}
                        </div>
                      </div>
                    </td>

                    {/* Verified Status Badge */}
                    <td className="py-4 px-4 text-center">
                      {review.isVerifiedPurchase ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-border/30 text-text-secondary">
                          Unverified
                        </span>
                      )}
                    </td>

                    {/* Submission Date */}
                    <td className="py-4 px-4 text-xs text-text-secondary whitespace-nowrap">
                      {formatDate(review.createdAt)}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedReview(review)}
                          className="p-1.5 rounded-md hover:bg-border/30 text-text-secondary hover:text-text-primary transition-colors"
                          title="View review details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingReview(review)}
                          className="p-1.5 rounded-md hover:bg-rose-500/15 text-text-secondary hover:text-rose-600 transition-colors"
                          title="Remove review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              Page {pageParam + 1} of {totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={pageParam === 0}
                onClick={() => updateFilter('page', (pageParam - 1).toString())}
                className="p-2 border border-border rounded-lg text-text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-border/20 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pageParam >= totalPages - 1}
                onClick={() => updateFilter('page', (pageParam + 1).toString())}
                className="p-2 border border-border rounded-lg text-text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-border/20 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Details Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquareQuote className="w-5 h-5 text-accent" />
                <h3 className="font-serif text-lg font-bold text-text-primary">
                  Review Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-border/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Rating & Verified Pill */}
              <div className="flex items-center justify-between bg-background p-4 rounded-xl border border-border">
                <div>
                  <span className="text-xs uppercase tracking-wider text-text-secondary font-semibold block mb-1">
                    Rating
                  </span>
                  {renderStars(selectedReview.rating, 'lg')}
                </div>
                <div>
                  {selectedReview.isVerifiedPurchase ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Verified Purchase
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-border/30 text-text-secondary">
                      Unverified Review
                    </span>
                  )}
                </div>
              </div>

              {/* Review Comment Text */}
              <div className="space-y-1.5">
                <span className="text-xs uppercase tracking-wider text-text-secondary font-semibold block">
                  Customer Comment
                </span>
                <div className="p-4 bg-background border border-border rounded-xl text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                  {selectedReview.comment || 'No comment provided.'}
                </div>
              </div>

              {/* Product Info Card */}
              <div className="space-y-1.5">
                <span className="text-xs uppercase tracking-wider text-text-secondary font-semibold block">
                  Product
                </span>
                <div className="flex items-center space-x-3.5 p-3.5 bg-background border border-border rounded-xl">
                  {selectedReview.productThumbnailImage ? (
                    <img
                      src={selectedReview.productThumbnailImage}
                      alt={selectedReview.productName}
                      className="w-12 h-12 rounded-lg object-cover border border-border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-border/20 flex items-center justify-center text-text-secondary">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">
                      {selectedReview.productName || `Product #${selectedReview.productId}`}
                    </h4>
                    <span className="text-xs text-text-secondary">
                      ID: #{selectedReview.productId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="space-y-1.5">
                <span className="text-xs uppercase tracking-wider text-text-secondary font-semibold block">
                  Customer
                </span>
                <div className="flex items-center space-x-3.5 p-3.5 bg-background border border-border rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-sm">
                    {selectedReview.user?.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">
                      {selectedReview.user?.fullName || 'Guest Customer'}
                    </h4>
                    <span className="text-xs text-text-secondary">
                      {selectedReview.user?.email || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-xs text-text-secondary pt-2 border-t border-border">
                <div>
                  <span className="block font-medium text-text-primary">Submitted:</span>
                  {formatDate(selectedReview.createdAt)}
                </div>
                <div>
                  <span className="block font-medium text-text-primary">Last Updated:</span>
                  {formatDate(selectedReview.updatedAt || selectedReview.createdAt)}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-border bg-background flex items-center justify-between">
              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 border border-border rounded-lg text-xs font-semibold text-text-primary hover:bg-border/20 transition-colors"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setDeletingReview(selectedReview);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Remove Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Review Removal */}
      {deletingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-rose-500">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-text-primary">
                Remove Review?
              </h3>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to permanently remove this review by{' '}
              <strong className="text-text-primary">{deletingReview.user?.fullName || 'Customer'}</strong> for{' '}
              <strong className="text-text-primary">{deletingReview.productName || 'this product'}</strong>? This review will no longer be visible on the store front.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-border">
              <button
                disabled={deleting}
                onClick={() => setDeletingReview(null)}
                className="px-4 py-2 border border-border rounded-lg text-xs font-semibold text-text-primary hover:bg-border/20 transition-colors"
              >
                Cancel
              </button>

              <button
                disabled={deleting}
                onClick={handleRemoveReview}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  'Remove Review'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
