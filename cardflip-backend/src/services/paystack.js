import axios from 'axios';
import crypto from 'crypto';

const ps = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  timeout: 30000,
});

export const verifyAccount = async (account_number, bank_code) => {
  const { data } = await ps.get('/bank/resolve', { params: { account_number, bank_code } });
  return data;
};

export const getBanks = async () => {
  const { data } = await ps.get('/bank?country=nigeria&perPage=100');
  return data;
};

export const createRecipient = async ({ name, account_number, bank_code }) => {
  const { data } = await ps.post('/transferrecipient', {
    type: 'nuban', name, account_number, bank_code, currency: 'NGN',
  });
  return data;
};

export const initiateTransfer = async ({ amount, recipient, reason, reference }) => {
  const { data } = await ps.post('/transfer', {
    source: 'balance', amount: Math.round(amount * 100), recipient, reason, reference,
  });
  return data;
};

export const verifyWebhook = (body, signature) => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  return hash === signature;
};
