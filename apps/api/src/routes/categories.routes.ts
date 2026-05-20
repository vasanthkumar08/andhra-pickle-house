import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json({
      success: true,
      data: categories.map((c) => ({
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
