"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
// Initialize Redis
const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.NODE_ENV === "production" ? {} : undefined,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
};
// Support for Redis URL in production (Upstash)
const redis = process.env.REDIS_URL
    ? new ioredis_1.default(process.env.REDIS_URL)
    : new ioredis_1.default(REDIS_CONFIG);
exports.default = redis;
