import { createClient } from 'redis';

let client;

export const connectRedis = async () => {
  client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  client.on('error', (err) => console.error('Redis error:', err));
  await client.connect();
  return client;
};

export const redis = {
  get: async (key) => {
    if (!client) return null;
    return client.get(key);
  },
  set: async (key, value) => {
    if (!client) return null;
    return client.set(key, value);
  },
  setex: async (key, ttl, value) => {
    if (!client) return null;
    return client.setEx(key, ttl, value);
  },
  del: async (key) => {
    if (!client) return null;
    return client.del(key);
  },
  keys: async (pattern) => {
    if (!client) return [];
    return client.keys(pattern);
  },
  ping: async () => {
    if (!client) return null;
    return client.ping();
  },
};
