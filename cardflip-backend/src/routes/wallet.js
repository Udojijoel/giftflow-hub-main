import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getBalance, getTransactions, addBank, getBanks, deleteBank, withdraw } from '../controllers/wallet.controller.js';

const router = Router();
router.use(authenticate);

router.get('/balance', getBalance);
router.get('/transactions', getTransactions);
router.get('/banks', getBanks);
router.delete('/banks/:id', deleteBank);

router.post('/add-bank', validate(z.object({
  bank_code: z.string().min(3, 'Invalid bank code').max(10),
  account_number: z.string().length(10, 'Account number must be 10 digits').regex(/^\d+$/),
})), addBank);

router.post('/withdraw', validate(z.object({
  amount: z.number({ invalid_type_error: 'Amount must be a number' }).min(1000, 'Minimum withdrawal is ₦1,000'),
  bank_account_id: z.string().cuid('Invalid bank account'),
  pin: z.string().length(6, 'PIN must be 6 digits').regex(/^\d+$/, 'PIN must be numbers only'),
})), withdraw);

export default router;
