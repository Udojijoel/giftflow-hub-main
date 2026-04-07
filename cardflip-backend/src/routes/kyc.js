import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { getKycStatus, submitKyc } from '../controllers/kyc.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);
router.get('/status', getKycStatus);
router.post('/submit', upload.fields([{ name: 'selfie', maxCount: 1 }, { name: 'id_card', maxCount: 1 }]), submitKyc);
export default router;
