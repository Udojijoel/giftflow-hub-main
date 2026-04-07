import { prisma } from '../services/prisma.js';
import { uploadImage } from '../services/cloudinary.js';
import { AppError } from '../utils/AppError.js';

// GET /kyc/status
export const getKycStatus = async (req, res, next) => {
  try {
    const kyc = await prisma.kYC.findUnique({ where: { user_id: req.user.id } });
    res.json({ kyc_status: req.user.kyc_status, kyc: kyc || null });
  } catch (err) { next(err); }
};

// POST /kyc/submit
export const submitKyc = async (req, res, next) => {
  try {
    const { bvn, nin } = req.body;
    const userId = req.user.id;

    if (req.user.kyc_status === 'Verified') throw new AppError('KYC already verified', 400);

    let selfie_url = null;
    let id_card_url = null;

    if (req.files?.selfie?.[0]) {
      const r = await uploadImage(req.files.selfie[0].buffer, { folder: 'cardflip/kyc/selfies' });
      selfie_url = r.secure_url;
    }
    if (req.files?.id_card?.[0]) {
      const r = await uploadImage(req.files.id_card[0].buffer, { folder: 'cardflip/kyc/ids' });
      id_card_url = r.secure_url;
    }

    await prisma.$transaction(async (tx) => {
      await tx.kYC.upsert({
        where: { user_id: userId },
        create: { user_id: userId, bvn, nin, selfie_url, id_card_url, status: 'Pending' },
        update: { bvn, nin, selfie_url, id_card_url, status: 'Pending' },
      });
      await tx.user.update({ where: { id: userId }, data: { kyc_status: 'Pending' } });
    });

    res.json({ message: 'KYC submitted for review. You will be verified within 24 hours.' });
  } catch (err) { next(err); }
};
