import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
  tls: {}, // enable TLS explicitly
  maxRetriesPerRequest: 5, // limit retries
  retryStrategy(times) {
    if (times > 10) {
      return null; // stop retrying after 10 attempts
    }
    return Math.min(times * 1000, 30000); // exponential backoff capped at 30s
  },
  reconnectOnError(err) {
    if (err.message.includes('ECONNRESET')) {
      return true; // reconnect on connection reset errors
    }
    return false;
  },
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('close', () => {
  console.log('Redis connection closed');
});





