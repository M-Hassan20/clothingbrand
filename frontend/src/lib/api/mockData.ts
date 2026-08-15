import { ProductDetailResponse, CategoryResponse, ReviewResponse, ReviewStats } from '@/types/api';

export const MOCK_CATEGORIES: CategoryResponse[] = [
  { id: 1, name: 'New Arrivals', slug: 'new-arrivals', description: 'Explore our latest seasonal edits' },
  { id: 2, name: 'Knitwear', slug: 'knitwear', description: 'Cozy cashmere and soft ribbed knits' },
  { id: 3, name: 'Outerwear', slug: 'outerwear', description: 'Tailored trench coats, jackets, and wrap coats' },
  { id: 4, name: 'Essentials', slug: 'essentials', description: 'Timeless basics for your everyday capsule wardrobe' }
];

export const MOCK_PRODUCTS: ProductDetailResponse[] = [
  {
    id: 101,
    name: 'Ribbed Knit Midi Dress',
    description: 'An elegant ribbed midi dress crafted from a soft wool-cashmere blend. Features a high mock neck, long sleeves, and a subtle side slit for ease of movement. The warm neutral tone complements any minimal autumn-winter styling.',
    brand: 'Haus of Hafsah',
    category: { id: 2, name: 'Knitwear' },
    minPrice: 120.00,
    maxPrice: 145.00,
    thumbnailImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600',
    averageRating: 4.8,
    reviewCount: 24,
    isActive: true,
    createdAt: '2026-08-01T10:00:00Z',
    availableSizes: ['XS', 'S', 'M', 'L'],
    availableColors: ['Beige', 'Ivory', 'Charcoal'],
    variants: [
      { id: 1001, size: 'XS', color: 'Beige', price: 120.00, stockQuantity: 5, sku: 'HOH-RKD-BE-XS', publicImageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600', inStock: true },
      { id: 1002, size: 'S', color: 'Beige', price: 120.00, stockQuantity: 8, sku: 'HOH-RKD-BE-S', publicImageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600', inStock: true },
      { id: 1003, size: 'M', color: 'Beige', price: 120.00, stockQuantity: 12, sku: 'HOH-RKD-BE-M', publicImageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600', inStock: true },
      { id: 1004, size: 'L', color: 'Beige', price: 120.00, stockQuantity: 0, sku: 'HOH-RKD-BE-L', publicImageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600', inStock: false },
      { id: 1005, size: 'S', color: 'Ivory', price: 130.00, stockQuantity: 3, sku: 'HOH-RKD-IV-S', publicImageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', inStock: true },
      { id: 1006, size: 'M', color: 'Ivory', price: 130.00, stockQuantity: 6, sku: 'HOH-RKD-IV-M', publicImageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', inStock: true },
      { id: 1007, size: 'L', color: 'Ivory', price: 130.00, stockQuantity: 0, sku: 'HOH-RKD-IV-L', publicImageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', inStock: false },
      { id: 1008, size: 'S', color: 'Charcoal', price: 145.00, stockQuantity: 4, sku: 'HOH-RKD-CH-S', publicImageUrl: 'https://images.unsplash.com/photo-1574164904299-3a102b110380?q=80&w=600', inStock: true },
      { id: 1009, size: 'M', color: 'Charcoal', price: 145.00, stockQuantity: 10, sku: 'HOH-RKD-CH-M', publicImageUrl: 'https://images.unsplash.com/photo-1574164904299-3a102b110380?q=80&w=600', inStock: true },
      { id: 1010, size: 'L', color: 'Charcoal', price: 145.00, stockQuantity: 2, sku: 'HOH-RKD-CH-L', publicImageUrl: 'https://images.unsplash.com/photo-1574164904299-3a102b110380?q=80&w=600', inStock: true },
    ]
  },
  {
    id: 102,
    name: 'Classic Belted Trench Coat',
    description: 'A timeless, double-breasted trench coat designed for effortless seasonal layering. Crafted from a structured cotton blend, it features storm flaps, epaulettes, adjustable wrist cuffs, and a matching fabric belt to cinch the waist.',
    brand: 'Haus of Hafsah',
    category: { id: 3, name: 'Outerwear' },
    minPrice: 190.00,
    maxPrice: 190.00,
    thumbnailImage: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600',
    averageRating: 4.9,
    reviewCount: 36,
    isActive: true,
    createdAt: '2026-08-03T11:00:00Z',
    availableSizes: ['S', 'M', 'L', 'XL'],
    availableColors: ['Camel', 'Charcoal'],
    variants: [
      { id: 2001, size: 'S', color: 'Camel', price: 190.00, stockQuantity: 4, sku: 'HOH-CTC-CA-S', publicImageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600', inStock: true },
      { id: 2002, size: 'M', color: 'Camel', price: 190.00, stockQuantity: 2, sku: 'HOH-CTC-CA-M', publicImageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600', inStock: true },
      { id: 2003, size: 'L', color: 'Camel', price: 190.00, stockQuantity: 6, sku: 'HOH-CTC-CA-L', publicImageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600', inStock: true },
      { id: 2004, size: 'XL', color: 'Camel', price: 190.00, stockQuantity: 0, sku: 'HOH-CTC-CA-XL', publicImageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600', inStock: false },
      { id: 2005, size: 'S', color: 'Charcoal', price: 190.00, stockQuantity: 5, sku: 'HOH-CTC-CH-S', publicImageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600', inStock: true },
      { id: 2006, size: 'M', color: 'Charcoal', price: 190.00, stockQuantity: 7, sku: 'HOH-CTC-CH-M', publicImageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600', inStock: true },
      { id: 2007, size: 'L', color: 'Charcoal', price: 190.00, stockQuantity: 3, sku: 'HOH-CTC-CH-L', publicImageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600', inStock: true },
    ]
  },
  {
    id: 103,
    name: 'Oversized Silk Button-Down',
    description: 'A luxurious silk button-down shirt designed with a relaxed, oversized drape. Featuring a pointed collar, buttoned cuffs, and a chest patch pocket, this versatile piece transitions seamlessly from casual lounging to tailored occasion-wear.',
    brand: 'Haus of Hafsah',
    category: { id: 4, name: 'Essentials' },
    minPrice: 95.00,
    maxPrice: 110.00,
    thumbnailImage: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600',
    averageRating: 4.6,
    reviewCount: 15,
    isActive: true,
    createdAt: '2026-08-04T12:00:00Z',
    availableSizes: ['XS', 'S', 'M', 'L'],
    availableColors: ['Ivory', 'Blush', 'Beige'],
    variants: [
      { id: 3001, size: 'XS', color: 'Ivory', price: 95.00, stockQuantity: 8, sku: 'HOH-OSB-IV-XS', publicImageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600', inStock: true },
      { id: 3002, size: 'S', color: 'Ivory', price: 95.00, stockQuantity: 10, sku: 'HOH-OSB-IV-S', publicImageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600', inStock: true },
      { id: 3003, size: 'M', color: 'Ivory', price: 95.00, stockQuantity: 12, sku: 'HOH-OSB-IV-M', publicImageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600', inStock: true },
      { id: 3004, size: 'L', color: 'Ivory', price: 95.00, stockQuantity: 4, sku: 'HOH-OSB-IV-L', publicImageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600', inStock: true },
      { id: 3005, size: 'S', color: 'Blush', price: 110.00, stockQuantity: 2, sku: 'HOH-OSB-BL-S', publicImageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600', inStock: true },
      { id: 3006, size: 'M', color: 'Blush', price: 110.00, stockQuantity: 0, sku: 'HOH-OSB-BL-M', publicImageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600', inStock: false },
      { id: 3007, size: 'S', color: 'Beige', price: 95.00, stockQuantity: 4, sku: 'HOH-OSB-BE-S', publicImageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', inStock: true },
      { id: 3008, size: 'M', color: 'Beige', price: 95.00, stockQuantity: 8, sku: 'HOH-OSB-BE-M', publicImageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', inStock: true },
    ]
  },
  {
    id: 104,
    name: 'Cashmere Mock-Neck Sweater',
    description: 'Luxuriously soft mock-neck sweater knitted from 100% fine Mongolian cashmere. Tailored for a slightly relaxed, slouchy fit with ribbed edges, drop shoulders, and a clean modern hemline.',
    brand: 'Haus of Hafsah',
    category: { id: 2, name: 'Knitwear' },
    minPrice: 165.00,
    maxPrice: 165.00,
    thumbnailImage: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600',
    averageRating: 4.7,
    reviewCount: 18,
    isActive: true,
    createdAt: '2026-08-05T09:30:00Z',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    availableColors: ['Beige', 'Ivory', 'Camel'],
    variants: [
      { id: 4001, size: 'XS', color: 'Beige', price: 165.00, stockQuantity: 3, sku: 'HOH-CMS-BE-XS', publicImageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', inStock: true },
      { id: 4002, size: 'S', color: 'Beige', price: 165.00, stockQuantity: 9, sku: 'HOH-CMS-BE-S', publicImageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', inStock: true },
      { id: 4003, size: 'M', color: 'Beige', price: 165.00, stockQuantity: 0, sku: 'HOH-CMS-BE-M', publicImageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', inStock: false },
      { id: 4004, size: 'L', color: 'Beige', price: 165.00, stockQuantity: 4, sku: 'HOH-CMS-BE-L', publicImageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600', inStock: true },
      { id: 4005, size: 'S', color: 'Ivory', price: 165.00, stockQuantity: 11, sku: 'HOH-CMS-IV-S', publicImageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600', inStock: true },
      { id: 4006, size: 'M', color: 'Ivory', price: 165.00, stockQuantity: 5, sku: 'HOH-CMS-IV-M', publicImageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600', inStock: true },
      { id: 4007, size: 'S', color: 'Camel', price: 165.00, stockQuantity: 3, sku: 'HOH-CMS-CA-S', publicImageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600', inStock: true },
      { id: 4008, size: 'M', color: 'Camel', price: 165.00, stockQuantity: 2, sku: 'HOH-CMS-CA-M', publicImageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600', inStock: true },
    ]
  },
  {
    id: 105,
    name: 'Tailored Linen Trousers',
    description: 'An elegant pair of wide-leg trousers cut from premium heavy-weight European flax linen. Designed with a high-rise waist, pleated front, belt loops, and hidden closures to offer a structured yet airy summery look.',
    brand: 'Haus of Hafsah',
    category: { id: 4, name: 'Essentials' },
    minPrice: 85.00,
    maxPrice: 95.00,
    thumbnailImage: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600',
    averageRating: 4.5,
    reviewCount: 11,
    isActive: true,
    createdAt: '2026-08-06T15:00:00Z',
    availableSizes: ['XS', 'S', 'M', 'L'],
    availableColors: ['Beige', 'Charcoal'],
    variants: [
      { id: 5001, size: 'XS', color: 'Beige', price: 85.00, stockQuantity: 4, sku: 'HOH-TLT-BE-XS', publicImageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600', inStock: true },
      { id: 5002, size: 'S', color: 'Beige', price: 85.00, stockQuantity: 6, sku: 'HOH-TLT-BE-S', publicImageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600', inStock: true },
      { id: 5003, size: 'M', color: 'Beige', price: 85.00, stockQuantity: 9, sku: 'HOH-TLT-BE-M', publicImageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600', inStock: true },
      { id: 5004, size: 'L', color: 'Beige', price: 85.00, stockQuantity: 2, sku: 'HOH-TLT-BE-L', publicImageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600', inStock: true },
      { id: 5005, size: 'S', color: 'Charcoal', price: 95.00, stockQuantity: 2, sku: 'HOH-TLT-CH-S', publicImageUrl: 'https://images.unsplash.com/photo-1574164904299-3a102b110380?q=80&w=600', inStock: true },
      { id: 5006, size: 'M', color: 'Charcoal', price: 95.00, stockQuantity: 0, sku: 'HOH-TLT-CH-M', publicImageUrl: 'https://images.unsplash.com/photo-1574164904299-3a102b110380?q=80&w=600', inStock: false },
    ]
  },
  {
    id: 106,
    name: 'Minimalist Wrap Wool Coat',
    description: 'A luxurious wrap coat styled in double-faced brushed virgin wool. Made with a relaxed silhouette, dropped shoulders, notched lapels, two patch front pockets, and an optional matching sash belt.',
    brand: 'Haus of Hafsah',
    category: { id: 3, name: 'Outerwear' },
    minPrice: 220.00,
    maxPrice: 240.00,
    thumbnailImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600',
    averageRating: 5.0,
    reviewCount: 9,
    isActive: true,
    createdAt: '2026-08-07T08:00:00Z',
    availableSizes: ['S', 'M', 'L'],
    availableColors: ['Camel', 'Charcoal'],
    variants: [
      { id: 6001, size: 'S', color: 'Camel', price: 220.00, stockQuantity: 3, sku: 'HOH-WWC-CA-S', publicImageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600', inStock: true },
      { id: 6002, size: 'M', color: 'Camel', price: 220.00, stockQuantity: 5, sku: 'HOH-WWC-CA-M', publicImageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600', inStock: true },
      { id: 6003, size: 'L', color: 'Camel', price: 220.00, stockQuantity: 0, sku: 'HOH-WWC-CA-L', publicImageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600', inStock: false },
      { id: 6004, size: 'S', color: 'Charcoal', price: 240.00, stockQuantity: 2, sku: 'HOH-WWC-CH-S', publicImageUrl: 'https://images.unsplash.com/photo-1574164904299-3a102b110380?q=80&w=600', inStock: true },
      { id: 6005, size: 'M', color: 'Charcoal', price: 240.00, stockQuantity: 4, sku: 'HOH-WWC-CH-M', publicImageUrl: 'https://images.unsplash.com/photo-1574164904299-3a102b110380?q=80&w=600', inStock: true },
    ]
  }
];

export const MOCK_REVIEWS: Record<number, ReviewResponse[]> = {
  101: [
    { id: 1, userId: 'u1', userFullName: 'Sophia Carter', productId: 101, rating: 5, comment: 'Absolutely beautiful fit. The wool blend is incredibly soft and warm. I get compliments every time I wear it!', createdAt: '2026-08-05T14:22:00Z' },
    { id: 2, userId: 'u2', userFullName: 'Olivia Martinez', productId: 101, rating: 4, comment: 'Very chic dress. Fits true to size, but length is slightly long for me (I am 5\'3"). Otherwise high quality.', createdAt: '2026-08-10T10:15:00Z' }
  ],
  102: [
    { id: 3, userId: 'u3', userFullName: 'Emma Watson', productId: 102, rating: 5, comment: 'The ultimate minimalist trench coat! Structured, sleek, and the camel color is simply gorgeous. Fits beautifully.', createdAt: '2026-08-06T09:45:00Z' }
  ]
};

export const MOCK_REVIEW_STATS: Record<number, ReviewStats> = {
  101: { averageRating: 4.8, reviewCount: 2, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 } },
  102: { averageRating: 5.0, reviewCount: 1, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 } }
};
