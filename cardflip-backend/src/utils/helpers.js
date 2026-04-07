import { randomBytes } from 'crypto';

export const nanoid = (size = 8) => randomBytes(size).toString('hex').toUpperCase().slice(0, size);

export const generateRef = (prefix = 'TXN') =>
  `${prefix}-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
