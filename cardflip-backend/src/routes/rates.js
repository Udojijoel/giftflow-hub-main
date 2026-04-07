import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getAllRates, getRatesByBrand } from '../controllers/rates.controller.js';

const router = Router();
router.use(authenticate);
router.get('/', getAllRates);
router.get('/:brandId', getRatesByBrand);
export default router;
