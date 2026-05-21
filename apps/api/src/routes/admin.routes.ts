import { Router, type NextFunction, type Request, type Response } from 'express';
import { OrderStatus, type Prisma } from '@prisma/client';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../middleware/auth';
import { orderService } from '../services/order.service';
import { analyticsService } from '../services/analytics.service';
import { productService } from '../services/product.service';
import { prisma } from '../lib/prisma';
import { cacheBumpVersion } from '../lib/redis';
import sanitizeHtml from 'sanitize-html';
import { jsonObjectSchema } from '../lib/json';

const router = Router();
router.use(authenticate, requireAdmin);

function routeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : value ?? '';
}

router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = z.nativeEnum(OrderStatus).optional().parse(req.query.status);
    const page = z.coerce.number().int().positive().default(1).parse(req.query.page);
    const result = await orderService.listForAdmin(status, page);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

router.patch('/orders/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = z.nativeEnum(OrderStatus).parse(req.body.status);
    const order = await orderService.updateStatus(routeParam(req.params.id), status);
    res.json({ success: true, data: order });
  } catch (e) {
    next(e);
  }
});

router.get('/analytics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [legacy, dashboard] = await Promise.all([
      orderService.getAnalytics(),
      analyticsService.getDashboard(),
    ]);
    res.json({ success: true, data: { ...legacy, dashboard } });
  } catch (e) {
    next(e);
  }
});

router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboard = await analyticsService.getDashboard();
    res.json({ success: true, data: dashboard });
  } catch (e) {
    next(e);
  }
});

router.get('/customers', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER', deletedAt: null },
      select: { id: true, phone: true, name: true, createdAt: true, lastLoginAt: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: customers });
  } catch (e) {
    next(e);
  }
});

router.get('/inventory', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: { product: { select: { name: true, slug: true } } },
    });
    res.json({ success: true, data: inventory });
  } catch (e) {
    next(e);
  }
});

router.patch('/inventory/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stock = z.number().int().min(0).parse(req.body.stock);
    const inv = await prisma.inventory.update({
      where: { id: routeParam(req.params.id) },
      data: { stock },
    });
    res.json({ success: true, data: inv });
  } catch (e) {
    next(e);
  }
});

router.get('/testimonials', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.testimonial.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

router.post('/testimonials', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      name: z.string(),
      location: z.string().optional(),
      reviewEn: z.string(),
      reviewTe: z.string().optional(),
      rating: z.number().min(1).max(5).default(5),
    }).parse(req.body);
    const item = await prisma.testimonial.create({
      data: {
        name: sanitizeHtml(body.name),
        location: body.location,
        reviewEn: sanitizeHtml(body.reviewEn),
        reviewTe: body.reviewTe ? sanitizeHtml(body.reviewTe) : undefined,
        rating: body.rating,
      },
    });
    await cacheBumpVersion('content:testimonials');
    res.json({ success: true, data: item });
  } catch (e) {
    next(e);
  }
});

router.get('/products', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      include: { inventory: true, category: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: products });
  } catch (e) {
    next(e);
  }
});

router.post('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      slug: z.string(),
      name: z.string(),
      nameTe: z.string().optional(),
      description: z.string(),
      imageUrl: z.string().url(),
      basePrice: z.number().int().positive(),
      spiceLevel: z.number().min(1).max(5),
      discountPercent: z.number().int().min(0).max(90).optional(),
      ingredients: z.string().optional(),
      featured: z.boolean().optional(),
      trending: z.boolean().optional(),
      videoUrl: z.string().url().optional(),
      categoryId: z.string().optional(),
    }).parse(req.body);
    const product = await prisma.product.create({ data: body });
    await productService.invalidateCache();
    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'PRODUCT_CREATE', entity: 'Product', entityId: product.id },
    });
    res.json({ success: true, data: product });
  } catch (e) {
    next(e);
  }
});

router.patch('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z
      .object({
        name: z.string().optional(),
        description: z.string().optional(),
        basePrice: z.number().int().positive().optional(),
        spiceLevel: z.number().min(1).max(5).optional(),
        discountPercent: z.number().int().min(0).max(90).optional(),
        isActive: z.boolean().optional(),
        featured: z.boolean().optional(),
        trending: z.boolean().optional(),
        stock: z.number().int().min(0).optional(),
        weightGrams: z.number().int().optional(),
      })
      .parse(req.body);

    const product = await prisma.product.update({
      where: { id: routeParam(req.params.id) },
      data: {
        name: body.name,
        description: body.description,
        basePrice: body.basePrice,
        spiceLevel: body.spiceLevel,
        discountPercent: body.discountPercent,
        isActive: body.isActive,
        featured: body.featured,
        trending: body.trending,
      },
    });

    if (body.stock !== undefined && body.weightGrams) {
      await prisma.inventory.updateMany({
        where: { productId: product.id, weightGrams: body.weightGrams },
        data: { stock: body.stock },
      });
    }

    await productService.invalidateCache();
    res.json({ success: true, data: product });
  } catch (e) {
    next(e);
  }
});

router.delete('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.product.update({
      where: { id: routeParam(req.params.id) },
      data: { deletedAt: new Date(), isActive: false },
    });
    await productService.invalidateCache();
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.post('/media', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z
      .object({
        type: z.enum(['image', 'video']),
        url: z.string().url(),
        alt: z.string().optional(),
        section: z.string(),
        sortOrder: z.number().int().optional(),
        metadata: jsonObjectSchema.optional(),
      })
      .parse(req.body);
    const metadata: Prisma.MediaAssetCreateInput['metadata'] = body.metadata;
    const asset = await prisma.mediaAsset.create({
      data: {
        ...body,
        metadata,
      },
    });
    res.json({ success: true, data: asset });
  } catch (e) {
    next(e);
  }
});

export default router;
