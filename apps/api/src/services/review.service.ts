import { prisma } from '../lib/prisma';
import { ValidationError, NotFoundError } from '../lib/errors';
import { productService } from './product.service';

export class ReviewService {
  async listByProduct(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId, isActive: true },
        include: { user: { select: { name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { productId, isActive: true } }),
    ]);

    return {
      items: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        author: r.user.name || `Customer ${r.user.phone.slice(-4)}`,
        createdAt: r.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async create(userId: string, productId: string, data: { rating: number; title?: string; body: string }) {
    if (data.rating < 1 || data.rating > 5) throw new ValidationError('Rating must be 1-5');

    const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
    if (!product) throw new NotFoundError('Product not found');

    const review = await prisma.review.create({
      data: { userId, productId, rating: data.rating, title: data.title, body: data.body },
    });

    const agg = await prisma.review.aggregate({
      where: { productId, isActive: true },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: agg._avg.rating ?? 0,
        reviewsCount: agg._count.id,
      },
    });

    await productService.invalidateCache();
    return review;
  }
}

export const reviewService = new ReviewService();
