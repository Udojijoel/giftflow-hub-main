import { prisma } from '../services/prisma.js';
import { uploadImage } from '../services/cloudinary.js';
import { creditWallet } from '../services/wallet.js';
import { AppError } from '../utils/AppError.js';

const tradeShape = (t) => ({
  id: t.id,
  user_id: t.user_id,
  card_brand: t.card_brand_name,
  card_type: t.card_type,
  denomination: t.denomination,
  quantity: t.quantity,
  card_image_url: t.card_image_url || null,
  ecode: t.ecode || null,
  naira_amount: parseFloat(t.naira_amount),
  status: t.status,
  admin_note: t.admin_note || null,
  created_at: t.created_at,
  updated_at: t.updated_at,
});

// POST /trades/submit
export const submitTrade = async (req, res, next) => {
  try {
    const { card_brand_id, card_type, denomination, quantity, ecode } = req.body;
    const userId = req.user.id;

    const rate = await prisma.cardRate.findFirst({
      where: { card_brand_id, card_type, denomination, is_active: true },
      include: { card_brand: true },
    });
    if (!rate) throw new AppError('No active rate found for this card configuration', 400);

    let card_image_url = null;
    if (req.file) {
      const result = await uploadImage(req.file.buffer, { folder: 'cardflip/trades' });
      card_image_url = result.secure_url;
    }

    if (!card_image_url && !ecode) throw new AppError('Card image or eCode is required', 400);

    const qty = parseInt(quantity) || 1;
    const naira_amount = parseFloat(denomination) * parseFloat(rate.rate_per_dollar) * qty;

    const trade = await prisma.trade.create({
      data: {
        user_id: userId,
        card_brand_id,
        card_brand_name: rate.card_brand.name,
        card_type,
        denomination,
        quantity: qty,
        card_image_url,
        ecode: ecode || null,
        naira_amount,
        rate_used: rate.rate_per_dollar,
        status: 'Pending',
      },
    });

    await prisma.notification.create({
      data: {
        user_id: userId,
        title: 'Trade Submitted',
        body: `Your ${rate.card_brand.name} $${denomination} trade is under review.`,
        type: 'TRADE_SUBMITTED',
        data: { trade_id: trade.id },
      },
    });

    const io = req.app.get('io');
    io?.to('admin').emit('trade:new', { trade_id: trade.id });

    res.status(201).json(tradeShape(trade));
  } catch (err) { next(err); }
};

// GET /trades
export const getUserTrades = async (req, res, next) => {
  try {
    const { page = 1, status } = req.query;
    const take = 20;
    const skip = (parseInt(page) - 1) * take;

    const where = { user_id: req.user.id };
    if (status) where.status = status;

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({ where, orderBy: { created_at: 'desc' }, skip, take }),
      prisma.trade.count({ where }),
    ]);

    res.json({ trades: trades.map(tradeShape), total });
  } catch (err) { next(err); }
};

// GET /trades/active
export const getActiveTrades = async (req, res, next) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { user_id: req.user.id, status: { in: ['Pending', 'Processing'] } },
      orderBy: { created_at: 'desc' },
    });
    res.json(trades.map(tradeShape));
  } catch (err) { next(err); }
};

// GET /trades/:id
export const getTradeById = async (req, res, next) => {
  try {
    const trade = await prisma.trade.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!trade) throw new AppError('Trade not found', 404);
    res.json(tradeShape(trade));
  } catch (err) { next(err); }
};

// ADMIN: GET /admin/trades/pending
export const adminGetPending = async (req, res, next) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { status: { in: ['Pending', 'Processing'] } },
      include: { user: { select: { id: true, full_name: true, phone: true, kyc_status: true } } },
      orderBy: { created_at: 'asc' },
    });
    res.json(trades);
  } catch (err) { next(err); }
};

// ADMIN: PATCH /admin/trades/:id/approve
export const adminApproveTrade = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_note } = req.body;

    const trade = await prisma.trade.findUnique({ where: { id } });
    if (!trade) throw new AppError('Trade not found', 404);
    if (!['Pending', 'Processing'].includes(trade.status)) {
      throw new AppError('Trade cannot be approved in its current state', 400);
    }

    await prisma.$transaction(async (tx) => {

      // 1. Update trade status to Approved
      await tx.trade.update({
        where: { id },
        data: {
          status: 'Approved',
          admin_note: admin_note || null,
          processed_by: req.user.id,
          processed_at: new Date(),
        },
      });

      // 2. Credit user wallet with trade amount
      await creditWallet(tx, {
        user_id: trade.user_id,
        amount: trade.naira_amount,
        description: `Trade approved — ${trade.card_brand_name} $${trade.denomination}`,
        metadata: { trade_id: trade.id },
      });

      // 3. Notify the user their trade was approved
      await tx.notification.create({
        data: {
          user_id: trade.user_id,
          title: 'Trade Approved! 🎉',
          body: `Your trade has been approved. ₦${parseFloat(trade.naira_amount).toLocaleString()} credited to your wallet.`,
          type: 'TRADE_APPROVED',
          data: { trade_id: trade.id },
        },
      });

      // 4. REFERRAL BONUS TRIGGER
      const approvedTradeCount = await tx.trade.count({
        where: { user_id: trade.user_id, status: 'Approved' },
      });

      if (approvedTradeCount === 1) {
        const referral = await tx.referral.findFirst({
          where: { referred_id: trade.user_id, is_paid: false },
        });

        if (referral) {
          await creditWallet(tx, {
            user_id: referral.referrer_id,
            amount: referral.bonus_amount,
            description: `Referral bonus — friend completed first trade`,
            metadata: { referral_id: referral.id, referred_user_id: trade.user_id },
          });

          await tx.referral.update({
            where: { id: referral.id },
            data: { is_paid: true, paid_at: new Date() },
          });

          await tx.notification.create({
            data: {
              user_id: referral.referrer_id,
              title: 'Referral Bonus Paid! 🎉',
              body: `₦${parseFloat(referral.bonus_amount).toLocaleString()} added to your wallet. Your referral just completed their first trade!`,
              type: 'REFERRAL_BONUS',
              data: { referral_id: referral.id, amount: parseFloat(referral.bonus_amount) },
            },
          });
        }
      }
    });

    const io = req.app.get('io');
    io?.to(`user:${trade.user_id}`).emit('trade:update', { trade_id: id, status: 'Approved' });

    res.json({ message: 'Trade approved and wallet credited' });
  } catch (err) { next(err); }
};

// ADMIN: PATCH /admin/trades/:id/reject
export const adminRejectTrade = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_note } = req.body;

    const trade = await prisma.trade.findUnique({ where: { id } });
    if (!trade) throw new AppError('Trade not found', 404);
    if (!['Pending', 'Processing'].includes(trade.status)) {
      throw new AppError('Trade cannot be rejected in its current state', 400);
    }

    await prisma.trade.update({
      where: { id },
      data: {
        status: 'Rejected',
        admin_note: admin_note || null,
        processed_by: req.user.id,
        processed_at: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        user_id: trade.user_id,
        title: 'Trade Rejected',
        body: `Your trade was rejected.${admin_note ? ` Reason: ${admin_note}` : ''}`,
        type: 'TRADE_REJECTED',
        data: { trade_id: trade.id },
      },
    });

    const io = req.app.get('io');
    io?.to(`user:${trade.user_id}`).emit('trade:update', {
      trade_id: id,
      status: 'Rejected',
      admin_note,
    });

    res.json({ message: 'Trade rejected' });
  } catch (err) { next(err); }
};

// ADMIN: GET /admin/trades
export const adminGetAllTrades = async (req, res, next) => {
  try {
    const { page = 1, status } = req.query;
    const take = 20;
    const skip = (parseInt(page) - 1) * take;
    const where = status ? { status } : {};

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        include: { user: { select: { id: true, full_name: true, phone: true } } },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      prisma.trade.count({ where }),
    ]);

    res.json({ trades, total });
  } catch (err) { next(err); }
};