import { Router } from 'express';
import { prisma } from '../services/prisma.js';
import { verifyWebhook } from '../services/paystack.js';
import { creditWallet } from '../services/wallet.js';

const router = Router();

router.post('/paystack', async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  if (!verifyWebhook(req.body, signature)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  res.sendStatus(200);

  try {
    const event = JSON.parse(req.body.toString());

    if (event.event === 'transfer.success') {
      await prisma.payout.updateMany({
        where: { paystack_reference: event.data.reference },
        data: { status: 'Completed' },
      });
    }

    if (event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
      const payout = await prisma.payout.findFirst({
        where: { paystack_reference: event.data.reference },
      });

      if (payout) {
        await prisma.$transaction(async (tx) => {
          await tx.payout.updateMany({
            where: { paystack_reference: event.data.reference },
            data: { status: 'Failed', failure_reason: event.data.reason || 'Transfer failed' },
          });

          await creditWallet(tx, {
            user_id: payout.user_id,
            amount: payout.amount,
            description: 'Payout reversal — transfer failed',
            metadata: { payout_id: payout.id },
          });

          await tx.notification.create({
            data: {
              user_id: payout.user_id,
              title: 'Payout Failed — Refunded',
              body: `Your withdrawal of ₦${parseFloat(payout.amount).toLocaleString()} failed. Amount returned to wallet.`,
              type: 'PAYOUT_FAILED',
              data: { payout_id: payout.id },
            },
          });
        });
      }
    }
  } catch (err) {
    console.error('Webhook error:', err);
  }
});

export default router;
