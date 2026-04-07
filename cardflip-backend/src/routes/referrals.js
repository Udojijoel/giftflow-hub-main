import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getReferralStats, getReferralHistory } from '../controllers/misc.controller.js';

const router = Router();
router.use(authenticate);
router.get('/stats', getReferralStats);
router.get('/history', getReferralHistory);
export default router;
