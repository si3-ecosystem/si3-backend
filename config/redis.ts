import Redis from "ioredis";

// Initialize Redis
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Create Redis client with error handling
const redis = new Redis(REDIS_CONFIG);

export default redis;
