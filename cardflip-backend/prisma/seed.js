import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const nanoid = (n = 8) => randomBytes(n).toString('hex').toUpperCase().slice(0, n);

const BRANDS = [
  { name: 'Amazon',           logo_url: null, sort_order: 1  },
  { name: 'iTunes / Apple',   logo_url: null, sort_order: 2  },
  { name: 'Google Play',      logo_url: null, sort_order: 3  },
  { name: 'Steam',            logo_url: null, sort_order: 4  },
  { name: 'Walmart',          logo_url: null, sort_order: 5  },
  { name: 'Target',           logo_url: null, sort_order: 6  },
  { name: 'eBay',             logo_url: null, sort_order: 7  },
  { name: 'Razer Gold',       logo_url: null, sort_order: 8  },
  { name: 'Sephora',          logo_url: null, sort_order: 9  },
  { name: 'Nike',             logo_url: null, sort_order: 10 },
  { name: 'Nordstrom',        logo_url: null, sort_order: 11 },
  { name: 'GameStop',         logo_url: null, sort_order: 12 },
  { name: 'PlayStation',      logo_url: null, sort_order: 13 },
  { name: 'Xbox',             logo_url: null, sort_order: 14 },
  { name: 'Netflix',          logo_url: null, sort_order: 15 },
  { name: 'Spotify',          logo_url: null, sort_order: 16 },
  { name: 'Visa Gift Card',   logo_url: null, sort_order: 17 },
  { name: 'Vanilla Visa',     logo_url: null, sort_order: 18 },
  { name: 'American Express', logo_url: null, sort_order: 19 },
  { name: 'Best Buy',         logo_url: null, sort_order: 20 },
  { name: 'Home Depot',       logo_url: null, sort_order: 21 },
  { name: 'Foot Locker',      logo_url: null, sort_order: 22 },
  { name: 'Macy\'s',          logo_url: null, sort_order: 23 },
  { name: 'Starbucks',        logo_url: null, sort_order: 24 },
  { name: 'DoorDash',         logo_url: null, sort_order: 25 },
  { name: 'Uber',             logo_url: null, sort_order: 26 },
  { name: 'Airbnb',           logo_url: null, sort_order: 27 },
  { name: 'Roblox',           logo_url: null, sort_order: 28 },
  { name: 'Fortnite',         logo_url: null, sort_order: 29 },
  { name: 'One Vanilla',      logo_url: null, sort_order: 30 },
];

const DENOMS    = ['10', '25', '50', '100', '200', '500'];
const TYPES     = ['Physical Card', 'eCode'];
const BASE_RATE = 1400;

async function main() {
  console.log('🌱 Seeding CardFlip database...\n');

  // Super admin
  const adminPw  = await bcrypt.hash('Admin@123456', 12);
  const adminPin = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { phone: '+2348000000000' },
    update: {},
    create: {
      phone: '+2348000000000',
      email: 'admin@cardflip.ng',
      password_hash: adminPw,
      pin_hash: adminPin,
      full_name: 'Super Admin',
      role: 'super_admin',
      kyc_status: 'Verified',
      referral_code: 'ADMIN001',
    },
  });

  await prisma.wallet.upsert({
    where: { user_id: admin.id },
    update: {},
    create: { user_id: admin.id, balance: 0 },
  });

  console.log('✅ Admin created:', admin.email);

  // Card brands + rates
  for (const brand of BRANDS) {
    const created = await prisma.cardBrand.upsert({
      where: { name: brand.name },
      update: { sort_order: brand.sort_order },
      create: brand,
    });

    for (const type of TYPES) {
      for (const denom of DENOMS) {
        const rate = type === 'eCode' ? Math.round(BASE_RATE * 1.02) : BASE_RATE;
        await prisma.cardRate.upsert({
          where: { card_brand_id_card_type_denomination: { card_brand_id: created.id, card_type: type, denomination: denom } },
          update: { rate_per_dollar: rate },
          create: { card_brand_id: created.id, card_type: type, denomination: denom, rate_per_dollar: rate },
        });
      }
    }

    console.log(`  ✅ ${brand.name}`);
  }

  console.log('\n🎉 Seed complete!');
  console.log('   Admin phone:    +2348000000000');
  console.log('   Admin password: Admin@123456');
  console.log('   Admin PIN:      123456');
  console.log('   Admin panel PIN (ADMIN_PIN env): 123456');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
