import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { cartService } from '../services/cart.service';

const addSchema = z.object({
  productId: z.string(),
  weightGrams: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20),
});

export const cartController = {
  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cart = await cartService.getOrCreateCart(req.user!.userId);
      res.json({ success: true, data: cart, requestId: req.requestId });
    } catch (error) {
      next(error);
    }
  },

  addItem: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = addSchema.parse(req.body);
      const cart = await cartService.addItem(
        req.user!.userId,
        body.productId,
        body.weightGrams,
        body.quantity
      );
      res.json({ success: true, data: cart, requestId: req.requestId });
    } catch (error) {
      next(error);
    }
  },

  updateItem: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quantity = z.number().int().min(0).parse(req.body.quantity);
      const itemId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const cart = await cartService.updateItem(req.user!.userId, itemId, quantity);
      res.json({ success: true, data: cart, requestId: req.requestId });
    } catch (error) {
      next(error);
    }
  },

  clear: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cart = await cartService.clearCart(req.user!.userId);
      res.json({ success: true, data: cart, requestId: req.requestId });
    } catch (error) {
      next(error);
    }
  },
};
