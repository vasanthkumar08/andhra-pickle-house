import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { orderService } from '../services/order.service';

const checkoutSchema = z.object({
  customerName: z.string().min(2).max(100),
  deliveryNotes: z.string().max(500).optional(),
  addressId: z.string().optional(),
  address: z
    .object({
      line1: z.string().min(3),
      line2: z.string().optional(),
      city: z.string().min(2),
      state: z.string().min(2),
      pincode: z.string().regex(/^\d{6}$/),
      phone: z.string().min(10),
    })
    .optional(),
});

export const orderController = {
  checkout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = checkoutSchema.parse(req.body);
      const result = await orderService.checkout(req.user!.userId, body);
      res.json({ success: true, data: result, requestId: req.requestId });
    } catch (error) {
      next(error);
    }
  },

  verify: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ref = z.string().parse(req.query.ref);
      const token = z.string().parse(req.query.token);
      const order = await orderService.verifyOrder(ref, token);
      res.json({ success: true, data: order, requestId: req.requestId });
    } catch (error) {
      next(error);
    }
  },

  mine: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await orderService.listMine(req.user!.userId);
      res.json({ success: true, data: orders, requestId: req.requestId });
    } catch (error) {
      next(error);
    }
  },
};
