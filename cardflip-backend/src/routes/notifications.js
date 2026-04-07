import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getNotifications, markAllRead } from '../controllers/misc.controller.js';

const router = Router();
router.use(authenticate);
router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
export default router;
