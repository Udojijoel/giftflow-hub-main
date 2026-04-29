import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma.js';
import { redis } from '../services/redis.js';
import { sendOTP, verifyOTP } from '../services/termii.js';
import { AppError } from '../utils/AppError.js';
import { nanoid } from '../utils/helpers.js';

const signTokens = (userId, role) => {
  const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ userId, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { accessToken, refreshToken };
};

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

const userShape = (user) => ({
  id: user.id,
  phone: user.phone,
  email: user.email || null,
  full_name: user.full_name || '',
  profile_photo: user.profile_photo || null,
  kyc_status: user.kyc_status,
  referral_code: user.referral_code,
  role: user.role,
});

// POST /auth/register
export const register = async (req, res, next) => {
  try {
    const { phone, password, pin, full_name, referral_code } = req.body;

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) throw new AppError('Phone number already registered', 409);

    const [password_hash, pin_hash] = await Promise.all([
      bcrypt.hash(password, 12),
      bcrypt.hash(pin, 10),
    ]);

    let referred_by = null;
    if (referral_code) {
      const referrer = await prisma.user.findUnique({ where: { referral_code } });
      if (referrer) referred_by = referrer.id;
    }

    // Store temp data and send OTP
    const tempData = { phone, password_hash, pin_hash, full_name, referred_by, referral_code: nanoid() };
    await redis.setex(`reg:${phone}`, 600, JSON.stringify(tempData));
    await sendOTP(phone, 'registration');

    res.json({ message: 'OTP sent to your phone number' });
  } catch (err) { next(err); }
};

// POST /auth/verify-otp
export const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    // Check if this is a registration OTP
    const tempDataRaw = await redis.get(`reg:${phone}`);
    if (tempDataRaw) {
      const valid = await verifyOTP(phone, otp, 'registration');
      if (!valid) throw new AppError('Invalid or expired OTP', 400);

      const tempData = JSON.parse(tempDataRaw);

      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({ data: { ...tempData, role: 'user' } });
        await tx.wallet.create({ data: { user_id: newUser.id, balance: 0 } });

        if (newUser.referred_by) {
          await tx.referral.create({
            data: { referrer_id: newUser.referred_by, referred_id: newUser.id, bonus_amount: 1000 },
          });
        }
        return newUser;
      });

      await redis.del(`reg:${phone}`);

      const { accessToken, refreshToken } = signTokens(user.id, user.role);
      setRefreshCookie(res, refreshToken);

      return res.status(200).json({ accessToken, user: userShape(user) });
    }

    // Password reset OTP
    const valid = await verifyOTP(phone, otp, 'reset_password');
    if (!valid) throw new AppError('Invalid or expired OTP', 400);

    await redis.setex(`pwd_reset_verified:${phone}`, 300, '1');
    res.json({ message: 'OTP verified' });
  } catch (err) { next(err); }
};

// POST /auth/login
export const login = async (req, res, next) => {
  try {
    const { phone, password, pin } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !user.is_active) throw new AppError('Invalid credentials', 401);
    if (user.is_frozen) throw new AppError('Your account has been suspended. Contact support.', 403);

    const [pwValid, pinValid] = await Promise.all([
      bcrypt.compare(password, user.password_hash),
      bcrypt.compare(pin, user.pin_hash),
    ]);

    if (!pwValid || !pinValid) throw new AppError('Invalid credentials', 401);

    await prisma.user.update({ where: { id: user.id }, data: { last_login_at: new Date() } });

    const { accessToken, refreshToken } = signTokens(user.id, user.role);
    setRefreshCookie(res, refreshToken);

    res.json({ accessToken, user: userShape(user) });
  } catch (err) { next(err); }
};

// POST /auth/refresh-token
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) throw new AppError('No refresh token', 401);

    const blacklisted = await redis.get(`bl:${token}`);
    if (blacklisted) throw new AppError('Token revoked', 401);

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.is_active || user.is_frozen) throw new AppError('Account unavailable', 401);

    await redis.setex(`bl:${token}`, 30 * 24 * 60 * 60, '1');
    const { accessToken, refreshToken: newRefresh } = signTokens(user.id, user.role);
    setRefreshCookie(res, newRefresh);

    res.json({ accessToken });
  } catch (err) { next(err); }
};

// POST /auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const user = await prisma.user.findUnique({ where: { phone } });
    if (user) await sendOTP(phone, 'reset_password');
    res.json({ message: 'If that number is registered, an OTP has been sent.' });
  } catch (err) { next(err); }
};

// POST /auth/reset-password
export const resetPassword = async (req, res, next) => {
  try {
    const { phone, otp, new_password } = req.body;

    // Check if already verified via verifyOtp step
    const preVerified = await redis.get(`pwd_reset_verified:${phone}`);
    if (!preVerified) {
      // Allow direct OTP check too
      const valid = await verifyOTP(phone, otp, 'reset_password');
      if (!valid) throw new AppError('Invalid or expired OTP', 400);
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await prisma.user.update({ where: { phone }, data: { password_hash } });
    await redis.del(`pwd_reset_verified:${phone}`);

    res.json({ message: 'Password reset successfully' });
  } catch (err) { next(err); }
};

// POST /auth/logout
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) await redis.setex(`bl:${token}`, 30 * 24 * 60 * 60, '1');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
};
