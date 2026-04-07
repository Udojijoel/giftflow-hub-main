import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import * as auth from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  message: { message: 'Too many attempts. Try again in 15 minutes.' },
});

router.post('/register', authLimiter, validate(z.object({
  phone: z.string().min(10),
  password: z.string().min(8),
  pin: z.string().length(6).regex(/^\d+$/),
  full_name: z.string().min(2),
  referral_code: z.string().optional(),
})), auth.register);

router.post('/verify-otp', validate(z.object({
  phone: z.string().min(10),
  otp: z.string().length(6),
})), auth.verifyOtp);

router.post('/login', authLimiter, validate(z.object({
  phone: z.string().min(10),
  password: z.string().min(1),
  pin: z.string().length(6).regex(/^\d+$/),
})), auth.login);

router.post('/refresh-token', auth.refreshToken);

router.post('/forgot-password', authLimiter, validate(z.object({
  phone: z.string().min(10),
})), auth.forgotPassword);

router.post('/reset-password', validate(z.object({
  phone: z.string().min(10),
  otp: z.string().optional(),
  new_password: z.string().min(8),
})), auth.resetPassword);

router.post('/logout', auth.logout);

export default router;
