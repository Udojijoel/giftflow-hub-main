import { AppError } from '../utils/AppError.js';

export const creditWallet = async (tx, { user_id, amount, description, metadata = {} }) => {
  const wallet = await tx.wallet.findUnique({ where: { user_id } });
  if (!wallet) throw new AppError('Wallet not found', 404);

  const before = parseFloat(wallet.balance);
  const after = before + parseFloat(amount);

  await tx.wallet.update({ where: { user_id }, data: { balance: { increment: parseFloat(amount) } } });

  return tx.transaction.create({
    data: {
      user_id, type: 'credit',
      amount: parseFloat(amount),
      balance_before: before,
      balance_after: after,
      description,
      metadata,
    },
  });
};

export const debitWallet = async (tx, { user_id, amount, description, metadata = {} }) => {
  const wallet = await tx.wallet.findUnique({ where: { user_id } });
  if (!wallet) throw new AppError('Wallet not found', 404);
  if (parseFloat(wallet.balance) < parseFloat(amount)) throw new AppError('Insufficient balance', 400);

  const before = parseFloat(wallet.balance);
  const after = before - parseFloat(amount);

  await tx.wallet.update({ where: { user_id }, data: { balance: { decrement: parseFloat(amount) } } });

  return tx.transaction.create({
    data: {
      user_id, type: 'debit',
      amount: parseFloat(amount),
      balance_before: before,
      balance_after: after,
      description,
      metadata,
    },
  });
};
