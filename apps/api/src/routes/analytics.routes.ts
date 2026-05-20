import { Router } from 'express';
import { z } from 'zod';
import { optionalAuth } from '../middleware/auth';
import { analyticsService } from '../services/analytics.service';
import { jsonObjectSchema } from '../lib/json';

const router = Router();

router.post('/track', optionalAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        event: z.string().min(1).max(80),
        payload: jsonObjectSchema.optional(),
        sessionId: z.string().optional(),
      })
      .parse(req.body);

    await analyticsService.track(body.event, body.payload, req.user?.userId, body.sessionId);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
