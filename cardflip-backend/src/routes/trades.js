import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { submitTrade, getUserTrades, getActiveTrades, getTradeById } from '../controllers/trade.controller.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
      ? cb(null, true) : cb(new Error('Images only'), false);
  },
});

router.use(authenticate);
router.post('/submit', upload.single('card_image'), validate(z.object({
  card_brand_id: z.string().min(1, 'Card brand required'),
  card_type: z.enum(['Physical Card', 'eCode', 'Receipt'], { errorMap: () => ({ message: 'Invalid card type' }) }),
  denomination: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid denomination'),
  quantity: z.string().regex(/^\d+$/).optional(),
  ecode: z.string().optional(),
})), submitTrade);

router.get('/active', getActiveTrades);
router.get('/', getUserTrades);
router.get('/:id', getTradeById);
export default router;
