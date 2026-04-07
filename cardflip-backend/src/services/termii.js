import axios from 'axios';
import { redis } from './redis.js';

const OTP_TTL = 600;

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTP = async (phone, purpose = 'verification') => {
  const otp = generateOtp();
  await redis.setex(`otp:${purpose}:${phone}`, OTP_TTL, otp);

  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 OTP [${purpose}] for ${phone}: ${otp}`);
    return { otp };
  }

  const normalised = phone.startsWith('+') ? phone : `+234${phone.slice(1)}`;
  const messages = {
    registration: `Your CardFlip verification code is ${otp}. Valid for 10 minutes. Do not share.`,
    reset_password: `Your CardFlip password reset code is ${otp}. Valid for 10 minutes.`,
    verification: `Your CardFlip OTP is ${otp}. Valid for 10 minutes.`,
  };

  try {
    await axios.post(`${process.env.TERMII_BASE_URL}/sms/send`, {
      to: normalised,
      from: process.env.TERMII_SENDER_ID,
      sms: messages[purpose] || messages.verification,
      type: 'plain',
      channel: 'dnd',
      api_key: process.env.TERMII_API_KEY,
    });
  } catch (err) {
    console.error('Termii error:', err.message);
  }

  return { otp };
};

export const verifyOTP = async (phone, otp, purpose = 'registration') => {
  const stored = await redis.get(`otp:${purpose}:${phone}`);
  if (!stored || stored !== otp.toString()) return false;
  await redis.del(`otp:${purpose}:${phone}`);
  return true;
};
