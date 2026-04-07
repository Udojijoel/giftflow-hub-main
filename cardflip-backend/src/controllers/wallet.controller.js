import bcrypt from 'bcryptjs';
import { prisma } from '../services/prisma.js';
import { verifyAccount, createRecipient, initiateTransfer } from '../services/paystack.js';
import { debitWallet } from '../services/wallet.js';
import { AppError } from '../utils/AppError.js';
import { generateRef } from '../utils/helpers.js';

// GET /wallet/balance
export const getBalance = async (req, res, next) => {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { user_id: req.user.id } });
    if (!wallet) throw new AppError('Wallet not found', 404);
    res.json({ balance: parseFloat(wallet.balance), currency: wallet.currency });
  } catch (err) { next(err); }
};

// GET /wallet/transactions
export const getTransactions = async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const take = 20;
    const skip = (parseInt(page) - 1) * take;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { user_id: req.user.id },
        orderBy: { created_at: 'desc' },
        skip, take,
      }),
      prisma.transaction.count({ where: { user_id: req.user.id } }),
    ]);

    res.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        description: t.description,
        reference: t.reference,
        created_at: t.created_at,
      })),
      total,
    });
  } catch (err) { next(err); }
};

// POST /wallet/add-bank
export const addBank = async (req, res, next) => {
  try {
    const { bank_code, account_number } = req.body;

    const verification = await verifyAccount(account_number, bank_code);
    if (!verification.status) throw new AppError('Could not verify bank account', 400);

    const account_name = verification.data.account_name;
    const bank_name = verification.data.bank_id
      ? verification.data.bank_name || bank_code
      : bank_code;

    const exists = await prisma.bankAccount.findFirst({
      where: { user_id: req.user.id, account_number, bank_code },
    });
    if (exists) throw new AppError('Bank account already saved', 409);

    const count = await prisma.bankAccount.count({ where: { user_id: req.user.id } });

    const bank = await prisma.bankAccount.create({
      data: {
        user_id: req.user.id,
        bank_name,
        bank_code,
        account_number,
        account_name,
        is_default: count === 0,
      },
    });

    res.status(201).json({
      id: bank.id,
      bank_name: bank.bank_name,
      bank_code: bank.bank_code,
      account_number: bank.account_number,
      account_name: bank.account_name,
      is_default: bank.is_default,
    });
  } catch (err) { next(err); }
};

// GET /wallet/banks
export const getBanks = async (req, res, next) => {
  try {
    const banks = await prisma.bankAccount.findMany({
      where: { user_id: req.user.id },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });
    res.json(banks.map((b) => ({
      id: b.id,
      bank_name: b.bank_name,
      bank_code: b.bank_code,
      account_number: b.account_number,
      account_name: b.account_name,
      is_default: b.is_default,
    })));
  } catch (err) { next(err); }
};

// DELETE /wallet/banks/:id
export const deleteBank = async (req, res, next) => {
  try {
    const bank = await prisma.bankAccount.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!bank) throw new AppError('Bank account not found', 404);
    await prisma.bankAccount.delete({ where: { id: bank.id } });
    res.json({ message: 'Bank account removed' });
  } catch (err) { next(err); }
};

// POST /wallet/withdraw
export const withdraw = async (req, res, next) => {
  try {
    const { amount, bank_account_id, pin } = req.body;
    const FEE = 100;
    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount < 1000) throw new AppError('Minimum withdrawal is ₦1,000', 400);

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const pinValid = await bcrypt.compare(pin, user.pin_hash);
    if (!pinValid) throw new AppError('Incorrect PIN', 401);

    const wallet = await prisma.wallet.findUnique({ where: { user_id: req.user.id } });
    const total = withdrawAmount + FEE;
    if (parseFloat(wallet.balance) < total) {
      throw new AppError(`Insufficient balance. Need ₦${total.toLocaleString()} (includes ₦${FEE} fee)`, 400);
    }

    const bank = await prisma.bankAccount.findFirst({
      where: { id: bank_account_id, user_id: req.user.id },
    });
    if (!bank) throw new AppError('Bank account not found', 404);

    const reference = generateRef('WD');

    await prisma.$transaction(async (tx) => {
      await debitWallet(tx, {
        user_id: req.user.id,
        amount: withdrawAmount,
        description: `Withdrawal to ${bank.bank_name} ****${bank.account_number.slice(-4)}`,
        metadata: { bank_account_id, reference },
      });

      await tx.transaction.create({
        data: {
          user_id: req.user.id,
          type: 'fee',
          amount: FEE,
          balance_before: parseFloat(wallet.balance) - withdrawAmount,
          balance_after: parseFloat(wallet.balance) - total,
          description: 'Withdrawal processing fee',
          reference: `FEE-${reference}`,
        },
      });
    });

    // Initiate Paystack transfer
    try {
      const recipient = await createRecipient({
        name: bank.account_name,
        account_number: bank.account_number,
        bank_code: bank.bank_code,
      });

      const transfer = await initiateTransfer({
        amount: withdrawAmount,
        recipient: recipient.data.recipient_code,
        reason: `CardFlip withdrawal — ${reference}`,
        reference,
      });

      await prisma.payout.create({
        data: {
          user_id: req.user.id,
          amount: withdrawAmount,
          bank_account_id,
          paystack_reference: reference,
          paystack_transfer_code: transfer.data?.transfer_code,
          status: transfer.data?.status === 'success' ? 'Completed' : 'Processing',
        },
      });
    } catch (paystackErr) {
      console.error('Paystack transfer error:', paystackErr.message);
      // Wallet already debited — payout tracked as pending for manual processing
      await prisma.payout.create({
        data: {
          user_id: req.user.id,
          amount: withdrawAmount,
          bank_account_id,
          paystack_reference: reference,
          status: 'Pending',
          failure_reason: paystackErr.message,
        },
      });
    }

    res.json({ message: `Withdrawal of ₦${withdrawAmount.toLocaleString()} initiated`, reference });
  } catch (err) { next(err); }
};
