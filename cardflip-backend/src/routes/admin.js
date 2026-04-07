import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  verifyAdminPin, getDashboardStats, getAllUsers, freezeUser,
  getPendingPayouts, processPayout, getAllTickets, replyToTicket,
} from '../controllers/admin.controller.js';
import {
  adminGetPending, adminApproveTrade, adminRejectTrade, adminGetAllTrades,
} from '../controllers/trade.controller.js';
import { adminGetRates, adminCreateRate, adminUpdateRate } from '../controllers/rates.controller.js';

const router = Router();

// Admin PIN verify (no auth needed — just PIN)
router.post('/auth/verify', verifyAdminPin);

// All routes below require JWT + admin role
router.use(authenticate, requireAdmin);

router.get('/dashboard/stats', getDashboardStats);

router.get('/trades/pending', adminGetPending);
router.patch('/trades/:id/approve', adminApproveTrade);
router.patch('/trades/:id/reject', adminRejectTrade);
router.get('/trades', adminGetAllTrades);

router.get('/users', getAllUsers);
router.patch('/users/:id/freeze', freezeUser);

router.get('/rates', adminGetRates);
router.post('/rates', adminCreateRate);
router.patch('/rates/:id', adminUpdateRate);

router.get('/payouts/pending', getPendingPayouts);
router.post('/payouts/:id/process', processPayout);

router.get('/support/tickets', getAllTickets);
router.post('/support/tickets/:id/reply', replyToTicket);

export default router;
