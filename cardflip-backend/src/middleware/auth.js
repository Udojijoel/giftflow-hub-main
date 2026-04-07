import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma.js';
import { AppError } from '../utils/AppError.js';

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new AppError('Authentication required', 401);

    const token = header.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') throw new AppError('Token expired', 401);
      throw new AppError('Invalid token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, phone: true, email: true, full_name: true,
        profile_photo: true, role: true, kyc_status: true,
        is_frozen: true, is_active: true, referral_code: true,
      },
    });

    if (!user || !user.is_active) throw new AppError('Account not found', 401);
    if (user.is_frozen) throw new AppError('Your account has been suspended. Contact support.', 403);

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireAdmin = (req, res, next) => {
  if (!['admin', 'super_admin'].includes(req.user?.role)) {
    return next(new AppError('Admin access required', 403));
  }
  next();
};
