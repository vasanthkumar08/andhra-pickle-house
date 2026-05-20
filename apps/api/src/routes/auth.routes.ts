import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authController } from '../controllers/auth.controller';

const router = Router();

router.post('/otp/request', authController.requestOtp);
router.post('/otp/verify', authController.verifyOtp);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
