import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import express, { Application, Request, Response, NextFunction } from "express";

import { allowedOrigins } from "../utils/allowedOrigins";

export const mainMiddleware = (app: Application): void => {
  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          mediaSrc: ["'self'", "https:"], // For video streaming
          frameSrc: ["'self'"], // For embedded content
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: function (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
      ],
      exposedHeaders: ["X-Total-Count", "X-Page-Count"],
    })
  );

  // Request logging (only in development)
  if (process.env.NODE_ENV === "development") {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const start: number = Date.now();

      console.log(
        `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${
          req.ip
        }`
      );

      res.on("finish", () => {
        const duration: number = Date.now() - start;
        console.log(
          `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${
            res.statusCode
          } - ${duration}ms`
        );
      });

      next();
    });
  }

  // Body parsing
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  app.disable("x-powered-by");

  // Data sanitization - Simple custom implementation
  app.use((req: Request, res: Response, next: NextFunction) => {
    const sanitize = (obj: any): any => {
      if (obj && typeof obj === "object") {
        for (const key in obj) {
          if (key.includes("$") || key.includes(".")) {
            delete obj[key];
          } else if (typeof obj[key] === "object") {
            sanitize(obj[key]);
          }
        }
      }
      return obj;
    };

    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);

    next();
  });

  // Rate limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      status: "error",
      error: {
        message: "Too many requests from this IP, please try again later.",
        statusCode: 429,
        errorCode: "TOO_MANY_REQUESTS",
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
      status: "error",
      error: {
        message: "Too many authentication attempts, please try again later.",
        statusCode: 429,
        errorCode: "TOO_MANY_REQUESTS",
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 upload requests per window
    message: {
      status: "error",
      error: {
        message: "Too many upload attempts, please try again later.",
        statusCode: 429,
        errorCode: "TOO_MANY_REQUESTS",
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting to API routes
  app.use("/api/", generalLimiter);
  app.use("/api/auth/", authLimiter);
  app.use("/api/upload/", uploadLimiter);
};
