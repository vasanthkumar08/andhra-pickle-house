export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}

export interface ProductVariant {
  weightGrams: number;
  label: string;
  priceInPaise: number;
  stock: number;
}

export interface PublicProduct {
  id: string;
  slug: string;
  name: string;
  nameTe?: string;
  description: string;
  imageUrl: string;
  images?: Array<{ url: string; alt?: string | null }>;
  videoUrl?: string | null;
  spiceLevel: number;
  discountPercent?: number;
  ingredients?: string | null;
  featured?: boolean;
  trending?: boolean;
  rating?: number;
  reviewsCount?: number;
  category?: { slug: string; name: string } | null;
  variants: ProductVariant[];
  inStock: boolean;
}

export interface CatalogResponse {
  items: PublicProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MediaAssetDto {
  id: string;
  type: string;
  url: string;
  alt?: string | null;
  section?: string | null;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
}

export interface LockedOrderSummary {
  orderRef: string;
  orderToken: string;
  customerPhone: string;
  customerName: string;
  items: Array<{
    name: string;
    weight: string;
    quantity: number;
    lineTotal: number;
  }>;
  subtotal: number;
  deliveryNotes?: string;
  address: string;
  createdAt: string;
}

