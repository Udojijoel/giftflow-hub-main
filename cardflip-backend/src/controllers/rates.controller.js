import { prisma } from '../services/prisma.js';
import { redis } from '../services/redis.js';
import { AppError } from '../utils/AppError.js';

const CACHE_KEY = 'rates:all';
const CACHE_TTL = 300;

const rateShape = (r) => ({
  id: r.id,
  card_brand_id: r.card_brand_id,
  brand_name: r.card_brand?.name || '',
  brand_logo: r.card_brand?.logo_url || '',
  card_type: r.card_type,
  denomination: r.denomination,
  rate_per_dollar: parseFloat(r.rate_per_dollar),
  is_active: r.is_active,
});

// GET /rates
export const getAllRates = async (req, res, next) => {
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) return res.json(JSON.parse(cached));

    const rates = await prisma.cardRate.findMany({
      where: { is_active: true },
      include: { card_brand: true },
      orderBy: [{ card_brand: { sort_order: 'asc' } }, { denomination: 'asc' }],
    });

    const shaped = rates.map(rateShape);
    await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(shaped));
    res.json(shaped);
  } catch (err) { next(err); }
};

// GET /rates/:brandId
export const getRatesByBrand = async (req, res, next) => {
  try {
    const cacheKey = `rates:brand:${req.params.brandId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const rates = await prisma.cardRate.findMany({
      where: { card_brand_id: req.params.brandId, is_active: true },
      include: { card_brand: true },
      orderBy: { denomination: 'asc' },
    });

    const shaped = rates.map(rateShape);
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(shaped));
    res.json(shaped);
  } catch (err) { next(err); }
};

export const invalidateRatesCache = async () => {
  const keys = await redis.keys('rates:*');
  for (const key of keys) await redis.del(key);
};

// ADMIN: GET /admin/rates
export const adminGetRates = async (req, res, next) => {
  try {
    const rates = await prisma.cardRate.findMany({
      include: { card_brand: true },
      orderBy: [{ card_brand: { name: 'asc' } }, { denomination: 'asc' }],
    });
    res.json(rates.map(rateShape));
  } catch (err) { next(err); }
};

// ADMIN: POST /admin/rates
export const adminCreateRate = async (req, res, next) => {
  try {
    const { card_brand_id, card_type, denomination, rate_per_dollar } = req.body;

    const rate = await prisma.cardRate.upsert({
      where: { card_brand_id_card_type_denomination: { card_brand_id, card_type, denomination } },
      create: { card_brand_id, card_type, denomination, rate_per_dollar, is_active: true },
      update: { rate_per_dollar, is_active: true },
      include: { card_brand: true },
    });

    await invalidateRatesCache();
    res.status(201).json(rateShape(rate));
  } catch (err) { next(err); }
};

// ADMIN: PATCH /admin/rates/:id
export const adminUpdateRate = async (req, res, next) => {
  try {
    const { rate_per_dollar, is_active } = req.body;
    const rate = await prisma.cardRate.update({
      where: { id: req.params.id },
      data: {
        ...(rate_per_dollar !== undefined && { rate_per_dollar }),
        ...(is_active !== undefined && { is_active }),
      },
      include: { card_brand: true },
    });
    await invalidateRatesCache();
    res.json(rateShape(rate));
  } catch (err) { next(err); }
};
