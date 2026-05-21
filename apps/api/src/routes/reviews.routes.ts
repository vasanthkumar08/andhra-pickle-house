import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { reviewService } from '../services/review.service';

const router = Router();
function routeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : value ?? '';
}

router.get('/product/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const data = await reviewService.listByProduct(routeParam(req.params.productId), page);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.post('/product/:productId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z
      .object({
        rating: z.number().int().min(1).max(5),
        title: z.string().max(120).optional(),
        body: z.string().min(10).max(2000),
      })
      .parse(req.body);
    const productId = routeParam(req.params.productId);
    const review = await reviewService.create(req.user!.userId, productId, body);
    res.json({ success: true, data: review });
  } catch (e) {
    next(e);
  }
});

export default router;
