import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";

import {
  notFoundHandler,
  globalErrorHandler,
} from "./controllers/errorController";
import { mainMiddleware } from "./middleware/mainMiddleware";

import emailRouter from "./routes/emailRoutes";

import redis from "./config/redis";
import redisHelper from "./helpers/redisHelper";

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "8080", 10);

// Trust proxy for production
app.set("trust proxy", 1);

// Apply middleware
mainMiddleware(app);

// Make Redis helper available globally
app.locals.redisHelper = redisHelper;

// Redis event handlers
redis.on("error", (error) => {
  console.error("Redis Error:", error);
});

redis.on("connect", () => {
  console.log("✅ Successfully connected to Redis");
});

// Root route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "SI3 Backend API",
    version: "1.0.0",
    status: "active",
    docs: "/api"
  });
});

// Health check endpoint
app.get("/health", async (req: Request, res: Response) => {
  const redisStatus = redis.status === "ready";

  res.status(200).json({
    status: "success",
    services: {
      redis: redisStatus ? "connected" : "disconnected",
    },
  });
});

// API root
app.get("/api", (req: Request, res: Response) => {
  res.json({
    message: "SI3 Backend API",
    version: "v1",
    status: "active",
  });
});

app.use("/api/email", emailRouter);

// Handle 404 errors
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Health: http://localhost:${PORT}/health`);
      console.log(`📊 API: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    const shutdown = (signal: string): void => {
      console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        try {
          await redis.quit();
          console.log("✅ Shutdown complete");
          process.exit(0);
        } catch (error) {
          console.error("❌ Shutdown error:", error);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Server start failed:", error);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on("uncaughtException", (error: Error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error: Error) => {
  console.error("❌ Unhandled Rejection:", error);
  process.exit(1);
});

// Start server
if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
