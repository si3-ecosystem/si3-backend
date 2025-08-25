import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";

import {
    notFoundHandler,
    globalErrorHandler,
} from "./controllers/errorController";
import { mainMiddleware } from "./middleware/mainMiddleware";

import authRouter from "./routes/authRoutes";
import emailRouter from "./routes/emailRoutes";
import commentRouter from "./routes/commentRoutes";
import rsvpRouter from "./routes/rsvpRoutes";
import userRouter from "./routes/userRoutes";
import webhookRouter from "./routes/webhookRoutes";
// import pinataRoutes from "./routes/pinataRoutes";

import redis from "./config/redis";
import { checkConnection, connectDB } from "./config/db";

import redisHelper from "./helpers/redisHelper";
import { UnlockService } from "./services/unlockService";

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
        cookieDomain: process.env.COOKIE_DOMAIN,
        production: process.env.NODE_ENV === "production",
    });
});

// Health check endpoint
app.get("/health", async (req: Request, res: Response) => {
    const redisStatus = redis.status === "ready";
    const dbStatus = checkConnection();

    res.status(200).json({
        status: "success",
        services: {
            redis: redisStatus ? "connected" : "disconnected",
            mongodb: dbStatus.isConnected ? "connected" : "disconnected",
            webhook: {
                configured: !!(
                    process.env.LOCK_ADDRESS && process.env.WEBHOOK_URL
                ),
                hasPrivateKey: !!process.env.UNLOCK_PRIVATE_KEY,
            },
        },
        cookieDomain: process.env.COOKIE_DOMAIN,
        production: process.env.NODE_ENV === "production",
    });
});

app.use("/api/auth", authRouter);
app.use("/api/email", emailRouter);
app.use("/api/comments", commentRouter);
app.use("/api/rsvp", rsvpRouter);
app.use("/api/user", userRouter);
app.use("/api/webhooks", webhookRouter);
// app.use("/api/pinata", pinataRoutes);

app.get("/api/system/status", (req: Request, res: Response) => {
    const memUsage = process.memoryUsage();

    res.json({
        status: "running",
        platform: "akash",
        uptime: process.uptime(),
        memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024) + " MB",
            total: Math.round(memUsage.heapTotal / 1024 / 1024) + " MB",
            external: Math.round(memUsage.external / 1024 / 1024) + " MB",
        },
        webhook: {
            configured: !!(process.env.LOCK_ADDRESS && process.env.WEBHOOK_URL),
            url: process.env.WEBHOOK_URL,
        },
        timestamp: new Date().toISOString(),
    });
});

// Handle 404 errors
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

// Start server
const startServer = async (): Promise<void> => {
    try {
        await connectDB();

        // Start server
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(
                `📱 Environment: ${process.env.NODE_ENV || "development"}`
            );
            console.log(`🔗 Health: http://localhost:${PORT}/health`);
        });

        // Wait for server to be ready, then initialize webhook
        // server.on("listening", async () => {
        //     console.log(
        //         "🔗 Server is listening, initializing webhook services..."
        //     );

        //     // Give server time to be fully ready
        //     setTimeout(async () => {
        //         try {
        //             const { UnlockService } = await import(
        //                 "./services/unlockService"
        //             );
        //             const unlockService = new UnlockService();

        //             // Authenticate with Unlock Protocol
        //             await unlockService.authenticateWithUnlock();
        //             console.log("✅ Unlock authentication successful");

        //             // Subscribe to webhooks if configuration is complete
        //             if (process.env.LOCK_ADDRESS && process.env.WEBHOOK_URL) {
        //                 await unlockService.subscribeToPurchases();
        //                 console.log("✅ Webhook subscription initialized");
        //             } else {
        //                 console.log(
        //                     "⚠️ Missing LOCK_ADDRESS or WEBHOOK_URL - webhook subscription skipped"
        //                 );
        //             }
        //         } catch (error) {
        //             console.error("❌ Webhook initialization failed:", error);
        //             // Don't exit - continue running without webhook
        //         }
        //     }, 10000); // Wait 10 seconds for full startup
        // });

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
