import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { submitTrade, getUserTrades, getActiveTrades, getTradeById } from '../controllers/trade.controller.js';

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
router.post('/submit', upload.single('card_image'), submitTrade);
router.get('/active', getActiveTrades);
router.get('/', getUserTrades);
router.get('/:id', getTradeById);
export default router;
