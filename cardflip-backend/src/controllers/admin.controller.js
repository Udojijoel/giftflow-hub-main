import { prisma } from '../services/prisma.js';
import { AppError } from '../utils/AppError.js';
import bcrypt from 'bcryptjs';

// POST /admin/auth/verify
export const verifyAdminPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    if (!pin || !/^\d{6}$/.test(pin)) throw new AppError('PIN must be 6 digits', 400);

    const adminPin = process.env.ADMIN_PIN || '';
    // Use timingSafeEqual to prevent timing attacks
    const { timingSafeEqual, Buffer } = await import('crypto');
    const a = Buffer.from(pin.padEnd(6));
    const b = Buffer.from(adminPin.padEnd(6));
    const valid = a.length === b.length && timingSafeEqual(a, b);

    if (!valid) throw new AppError('Invalid admin PIN', 401);
    res.json({ message: 'Admin access granted' });
  } catch (err) { next(err); }
};

// GET /admin/dashboard/stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      tradesToday, volumeToday, pendingCount,
      totalUsers, totalTrades, totalVolume,
    ] = await Promise.all([
      prisma.trade.count({ where: { created_at: { gte: today } } }),
      prisma.trade.aggregate({
        where: { created_at: { gte: today }, status: { in: ['Approved', 'Paid'] } },
        _sum: { naira_amount: true },
      }),
      prisma.trade.count({ where: { status: { in: ['Pending', 'Processing'] } } }),
      prisma.user.count({ where: { role: 'user' } }),
      prisma.trade.count(),
      prisma.trade.aggregate({
        where: { status: { in: ['Approved', 'Paid'] } },
        _sum: { naira_amount: true },
      }),
    ]);

    res.json({
      trades_today: tradesToday,
      volume_today: parseFloat(volumeToday._sum.naira_amount || 0),
      pending_count: pendingCount,
      total_users: totalUsers,
      total_trades: totalTrades,
      total_volume: parseFloat(totalVolume._sum.naira_amount || 0),
    });
  } catch (err) { next(err); }
};

// GET /admin/users
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const take = 50;
    const skip = (parseInt(page) - 1) * take;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip, take,
        orderBy: { created_at: 'desc' },
        select: {
          id: true, full_name: true, phone: true, email: true,
          kyc_status: true, is_frozen: true, role: true,
          created_at: true,
        },
      }),
      prisma.user.count(),
    ]);

    res.json({ users, total });
  } catch (err) { next(err); }
};

// PATCH /admin/users/:id/freeze
export const freezeUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError('User not found', 404);

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { is_frozen: !user.is_frozen },
    });

    res.json({ message: updated.is_frozen ? 'Account frozen' : 'Account unfrozen', is_frozen: updated.is_frozen });
  } catch (err) { next(err); }
};

// GET /admin/payouts/pending
export const getPendingPayouts = async (req, res, next) => {
  try {
    const payouts = await prisma.payout.findMany({
      where: { status: { in: ['Pending', 'Processing'] } },
      include: {
        user: { select: { full_name: true, phone: true } },
        bank_account: true,
      },
      orderBy: { created_at: 'asc' },
    });
    res.json(payouts);
  } catch (err) { next(err); }
};

// POST /admin/payouts/:id/process
export const processPayout = async (req, res, next) => {
  try {
    const payout = await prisma.payout.findUnique({ where: { id: req.params.id } });
    if (!payout) throw new AppError('Payout not found', 404);

    await prisma.payout.update({
      where: { id: req.params.id },
      data: { status: 'Completed' },
    });

    res.json({ message: 'Payout marked as completed' });
  } catch (err) { next(err); }
};

// GET /admin/support/tickets
export const getAllTickets = async (req, res, next) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        user: { select: { full_name: true, phone: true } },
        messages: { orderBy: { created_at: 'desc' }, take: 1 },
      },
      orderBy: { updated_at: 'desc' },
    });
    res.json(tickets);
  } catch (err) { next(err); }
};

// POST /admin/support/tickets/:id/reply
export const replyToTicket = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) throw new AppError('Message is required', 400);

    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket) throw new AppError('Ticket not found', 404);

    const msg = await prisma.supportMessage.create({
      data: { ticket_id: ticket.id, sender_id: req.user.id, message },
    });

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: 'InProgress', updated_at: new Date() },
    });

    await prisma.notification.create({
      data: {
        user_id: ticket.user_id,
        title: 'Support Reply',
        body: 'Your support ticket has been updated.',
        type: 'SUPPORT_REPLY',
        data: { ticket_id: ticket.id },
      },
    });

    const io = req.app.get('io');
    io?.to(`ticket:${ticket.id}`).emit('support:message', msg);
    io?.to(`user:${ticket.user_id}`).emit('support:message', { ticket_id: ticket.id, message: msg });

    res.json(msg);
  } catch (err) { next(err); }
};
