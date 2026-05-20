import { Router, type NextFunction, type Request, type Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();
type CategoryWithProductCount = Prisma.CategoryGetPayload<{
  include: { _count: { select: { products: true } } };
}>;

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories: CategoryWithProductCount[] = await prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json({
      success: true,
      data: categories.map((c: CategoryWithProductCount) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        nameTe: c.nameTe,
        productCount: c._count.products,
      })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
