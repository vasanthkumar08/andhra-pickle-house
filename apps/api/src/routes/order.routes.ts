import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { orderController } from '../controllers/order.controller';

const router = Router();

router.post('/checkout', authenticate, orderController.checkout);
router.get('/verify', orderController.verify);
router.get('/my', authenticate, orderController.mine);

export default router;
