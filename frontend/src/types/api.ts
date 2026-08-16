// Type definitions for Haus of Hafsah REST API

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface AuthResponse {
  token: string;
  type: string; // Bearer
  userId: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'CUSTOMER';
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  brand: string;
  category: {
    id: number;
    name: string;
  };
  minPrice: number;
  maxPrice: number;
  thumbnailImage: string | null;
  averageRating: number | null;
  reviewCount: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface ProductVariantResponse {
  id: number;
  size: string;
  color: string;
  price: number;
  stockQuantity: number;
  sku: string;
  publicImageUrl: string;
  inStock: boolean;
}

export interface ProductDetailResponse extends ProductResponse {
  variants: ProductVariantResponse[];
  availableSizes: string[];
  availableColors: string[];
}

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface CategoryWithProductsResponse extends CategoryResponse {
  products: ProductResponse[];
}

export interface CartDTO {
  userId: string;
  items: CartItemDTO[];
  totalPrice: number;
  lastUpdated: string;
}

export interface CartItemDTO {
  productVariantId: number;
  productName: string;
  variantName: string; // e.g. "M / Black"
  imageUrl: string;
  quantity: number;
  price: number;
  subtotal: number;
  stockQuantity?: number;
  productId?: number;
}

export interface OrderItemResponse {
  id: number;
  productVariantId: number;
  productName: string;
  variantName: string;
  imageUrl: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface OrderResponse {
  id: number;
  userId: string;
  status: string; // PENDING, PAID, SHIPPED, CANCELLED, etc.
  totalAmount: number;
  items: OrderItemResponse[];
  shippingAddress: AddressResponse;
  discountCode: string | null;
  createdAt: string;
}

export interface OrderCreateRequest {
  shippingAddressId: number;
  items: {
    productVariantId: number;
    quantity: number;
  }[];
  discountCode: string | null;
}

export interface AddressResponse {
  id: number;
  userId: string;
  label: string;
  street: string;
  city: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

export interface AddressCreateRequest {
  label: string;
  street: string;
  city: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

export interface GuestCheckoutRequest {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  shippingStreet: string;
  shippingCity: string;
  shippingCountry: string;
  shippingZipCode: string;
  items: {
    productVariantId: number;
    quantity: number;
  }[];
  discountCode: string | null;
}

export interface GuestReviewRequest {
  productId: number;
  guestEmail: string;
  rating: number;
  comment?: string;
}

export interface ReviewResponse {
  id: number;
  userId: string;
  userFullName?: string;
  user?: {
    id: number;
    email: string;
    fullName: string;
    phone?: string;
  };
  productId: number;
  rating: number;
  comment: string;
  isVerifiedPurchase?: boolean;
  createdAt: string;
}

export interface ReviewStats {
  averageRating: number;
  reviewCount: number;
  ratingDistribution: Record<number, number>; // e.g. { 1: 0, 2: 0, 3: 1, 4: 5, 5: 10 }
}

export interface ReviewCreateRequest {
  productId: number;
  rating: number;
  comment: string;
}

export interface BlogPostSummaryResponse {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  authorName: string;
  category: string;
  publishedAt: string;
}

export interface BlogPostDetailResponse {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  contentHtml: string;
  authorName: string;
  category: string;
  publishedAt: string;
  isPreview?: boolean;
}
