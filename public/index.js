"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const errorController_1 = require("./controllers/errorController");
const mainMiddleware_1 = require("./middleware/mainMiddleware");
const emailRoutes_1 = __importDefault(require("./routes/emailRoutes"));
const redis_1 = __importDefault(require("./config/redis"));
const redisHelper_1 = __importDefault(require("./helpers/redisHelper"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "3000", 10);
// Trust proxy for production
app.set("trust proxy", 1);
// Apply middleware
(0, mainMiddleware_1.mainMiddleware)(app);
// Make Redis helper available globally
app.locals.redisHelper = redisHelper_1.default;
// Redis event handlers
redis_1.default.on("error", (error) => {
    console.error("Redis Error:", error);
});
redis_1.default.on("connect", () => {
    console.log("✅ Successfully connected to Redis");
});
// Health check endpoint
app.get("/health", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const redisStatus = redis_1.default.status === "ready";
    res.status(200).json({
        status: "success",
        services: {
            redis: redisStatus ? "connected" : "disconnected",
        },
    });
}));
// API root
app.get("/api", (req, res) => {
    res.json({
        message: "SI3 Backend API",
        version: "v1",
        status: "active",
    });
});
app.use("/api/email", emailRoutes_1.default);
// Handle 404 errors
app.use(errorController_1.notFoundHandler);
// Global error handler
app.use(errorController_1.globalErrorHandler);
// Start server
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Start server
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
            console.log(`🔗 Health: http://localhost:${PORT}/health`);
            console.log(`📊 API: http://localhost:${PORT}/api`);
        });
        // Graceful shutdown
        const shutdown = (signal) => {
            console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
            server.close(() => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    yield redis_1.default.quit();
                    console.log("✅ Shutdown complete");
                    process.exit(0);
                }
                catch (error) {
                    console.error("❌ Shutdown error:", error);
                    process.exit(1);
                }
            }));
        };
        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    }
    catch (error) {
        console.error("❌ Server start failed:", error);
        process.exit(1);
    }
});
// Handle uncaught errors
process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
    process.exit(1);
});
process.on("unhandledRejection", (error) => {
    console.error("❌ Unhandled Rejection:", error);
    process.exit(1);
});
// Start server
if (process.env.NODE_ENV !== "test") {
    startServer();
}
exports.default = app;
