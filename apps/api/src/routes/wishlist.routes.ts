import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { wishlistService } from '../services/wishlist.service';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const items = await wishlistService.list(req.user!.userId);
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { productId } = z.object({ productId: z.string() }).parse(req.body);
    const item = await wishlistService.add(req.user!.userId, productId);
    res.json({ success: true, data: item });
  } catch (e) {
    next(e);
  }
});

router.delete('/:productId', async (req, res, next) => {
  try {
    await wishlistService.remove(req.user!.userId, req.params.productId);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
