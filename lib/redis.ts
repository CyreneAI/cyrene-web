// lib/redis.ts - Simple and reliable configuration
import Redis from 'ioredis';

let redis: Redis | null = null;
let pubsub: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3, // Increased back to 3
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    redis.on('error', (error) => {
      console.error('Redis client error:', error);
    });
  }
  return redis;
}

export function getRedisPubSub(): Redis {
  if (!pubsub) {
    pubsub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3, // Increased back to 3
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    pubsub.on('error', (error) => {
      console.error('Redis pubsub error:', error);
    });
  }
  return pubsub;
}