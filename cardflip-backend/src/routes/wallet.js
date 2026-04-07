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
  bank_code: z.string().min(3),
  account_number: z.string().length(10),
})), addBank);

router.post('/withdraw', validate(z.object({
  amount: z.number().min(1000),
  bank_account_id: z.string().min(1),
  pin: z.string().length(6).regex(/^\d+$/),
})), withdraw);

export default router;
