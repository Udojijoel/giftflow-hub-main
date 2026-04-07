import { prisma } from '../services/prisma.js';

// GET /referrals/stats
export const getReferralStats = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { referral_code: true },
    });

    const [total, earned] = await Promise.all([
      prisma.referral.count({ where: { referrer_id: req.user.id } }),
      prisma.referral.aggregate({
        where: { referrer_id: req.user.id, is_paid: true },
        _sum: { bonus_amount: true },
      }),
    ]);

    res.json({
      total_referrals: total,
      total_earned: parseFloat(earned._sum.bonus_amount || 0),
      referral_code: user.referral_code,
      referral_link: `${process.env.FRONTEND_URL}/signup?ref=${user.referral_code}`,
    });
  } catch (err) { next(err); }
};

// GET /referrals/history
export const getReferralHistory = async (req, res, next) => {
  try {
    const referrals = await prisma.referral.findMany({
      where: { referrer_id: req.user.id },
      include: { referred: { select: { full_name: true, phone: true } } },
      orderBy: { created_at: 'desc' },
    });

    res.json(referrals.map((r) => ({
      id: r.id,
      referred_name: r.referred?.full_name || r.referred?.phone || 'Unknown',
      bonus_amount: parseFloat(r.bonus_amount),
      is_paid: r.is_paid,
      created_at: r.created_at,
    })));
  } catch (err) { next(err); }
};

// GET /notifications
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    res.json(notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      is_read: n.is_read,
      created_at: n.created_at,
    })));
  } catch (err) { next(err); }
};

// PATCH /notifications/read-all
export const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { user_id: req.user.id, is_read: false },
      data: { is_read: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};
