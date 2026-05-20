import { Prisma } from '@prisma/client';
import { WEIGHT_OPTIONS } from '@aph/shared';
import { prisma } from '../lib/prisma';
import { cacheBumpVersion, cacheGet, cacheGetVersion, cacheSet } from '../lib/redis';

function calcPrice(basePricePaise: number, weightGrams: number, discountPercent = 0): number {
  const opt = WEIGHT_OPTIONS.find((w) => w.grams === weightGrams);
  const raw = Math.round(basePricePaise * (opt?.multiplier ?? 1));
  return Math.round(raw * (1 - discountPercent / 100));
}

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { inventory: true; images: true; category: true };
}>;

export interface CatalogQuery {
  q?: string;
  categorySlug?: string;
  featured?: boolean;
  trending?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

export class ProductService {
  async listPublic() {
    const version = await cacheGetVersion('products');
    const cacheKey = `products:public:v${version}`;
    const cached = await cacheGet<ReturnType<typeof this.mapProducts>>(cacheKey);
    if (cached) return cached;

    const products = await prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        inventory: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 3 },
        category: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    const mapped = this.mapProducts(products);
    await cacheSet(cacheKey, mapped, 120);
    return mapped;
  }

  async listCatalog(query: CatalogQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(48, Math.max(1, query.limit ?? 12));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      deletedAt: null,
      ...(query.featured ? { featured: true } : {}),
      ...(query.trending ? { trending: true } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
              { description: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
              { ingredients: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
      ...(query.categorySlug ? { category: { slug: query.categorySlug } } : {}),
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput = { sortOrder: 'asc' };
    if (query.sort === 'rating') orderBy = { rating: 'desc' };
    if (query.sort === 'newest') orderBy = { createdAt: 'desc' };
    if (query.sort === 'price_asc' || query.sort === 'price_desc') orderBy = { basePrice: query.sort === 'price_asc' ? 'asc' : 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          inventory: true,
          images: { orderBy: { sortOrder: 'asc' }, take: 3 },
          category: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items: this.mapProducts(products),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private mapProducts(products: ProductWithRelations[]) {
    return products.map((p) => this.mapOne(p));
  }

  private mapOne(p: ProductWithRelations) {
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      nameTe: p.nameTe,
      description: p.description,
      imageUrl: p.imageUrl,
      images: p.images?.map((img) => ({ url: img.url, alt: img.alt })) ?? [],
      videoUrl: p.videoUrl,
      spiceLevel: p.spiceLevel,
      discountPercent: p.discountPercent,
      ingredients: p.ingredients,
      featured: p.featured,
      trending: p.trending,
      rating: p.rating,
      reviewsCount: p.reviewsCount,
      category: p.category ? { slug: p.category.slug, name: p.category.name } : null,
      inStock: p.inventory.some((i) => i.stock - i.reserved > 0),
      variants: p.inventory.map((inv) => ({
        weightGrams: inv.weightGrams,
        label: `${inv.weightGrams}g`,
        priceInPaise: calcPrice(p.basePrice, inv.weightGrams, p.discountPercent),
        stock: Math.max(0, inv.stock - inv.reserved),
      })),
    };
  }

  async getBySlug(slug: string) {
    const version = await cacheGetVersion('products');
    const cached = await cacheGet<Awaited<ReturnType<typeof this.mapOne>>>(`product:${slug}:v${version}`);
    if (cached) return cached;

    const p = await prisma.product.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      include: {
        inventory: true,
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
    });
    if (!p) return null;

    const mapped = this.mapOne(p);
    await cacheSet(`product:${slug}:v${version}`, mapped, 120);
    return mapped;
  }

  async getRelated(slug: string, limit = 4) {
    const current = await prisma.product.findFirst({ where: { slug } });
    if (!current) return [];

    const related = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        slug: { not: slug },
        OR: [{ categoryId: current.categoryId }, { spiceLevel: current.spiceLevel }],
      },
      include: { inventory: true, images: { take: 1 }, category: true },
      take: limit,
    });
    return this.mapProducts(related);
  }

  async invalidateCache() {
    await cacheBumpVersion('products');
  }
}

export const productService = new ProductService();
