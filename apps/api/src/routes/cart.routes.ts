import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { cartController } from '../controllers/cart.controller';

const router = Router();
router.use(authenticate);

router.get('/', cartController.get);
router.post('/items', cartController.addItem);
router.patch('/items/:id', cartController.updateItem);
router.delete('/', cartController.clear);

export default router;
