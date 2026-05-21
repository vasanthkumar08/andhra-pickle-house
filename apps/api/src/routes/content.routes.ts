import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { cacheGet, cacheGetVersion, cacheSet } from '../lib/redis';

const router = Router();

router.get('/testimonials', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const version = await cacheGetVersion('content:testimonials');
    const key = `content:testimonials:v${version}`;
    const cached = await cacheGet(key);
    if (cached) return res.json({ success: true, data: cached });

    const items = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    await cacheSet(key, items, 300);
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

router.get('/media', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const section = z.string().optional().parse(req.query.section);
    const items = await prisma.mediaAsset.findMany({
      where: { isActive: true, ...(section ? { section } : {}) },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

export default router;
