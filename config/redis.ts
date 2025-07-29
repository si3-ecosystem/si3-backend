import Redis from "ioredis";

// Initialize Redis
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD,

  tls: process.env.NODE_ENV === "production" ? {} : undefined,

  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Support for Redis URL in production (Upstash)
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : new Redis(REDIS_CONFIG);

export default redis;
