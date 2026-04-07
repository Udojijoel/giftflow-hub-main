import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { getTickets, getTicketById, createTicket, sendMessage } from '../controllers/support.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);
router.get('/tickets', getTickets);
router.post('/tickets', createTicket);
router.get('/tickets/:id', getTicketById);
router.post('/tickets/:ticketId/messages', upload.single('attachment'), sendMessage);
export default router;
