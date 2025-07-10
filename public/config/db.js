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
exports.checkConnection = exports.closeConnection = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Simple connection state
let isConnected = false;
// MongoDB connection options
const mongooseOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};
// Connect to database
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    if (isConnected) {
        console.log("✅ MongoDB already connected");
        return;
    }
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error("MONGO_URI not found in environment variables");
        }
        console.log("📦 Connecting to MongoDB...");
        yield mongoose_1.default.connect(mongoURI, mongooseOptions);
        isConnected = true;
        console.log("✅ MongoDB connected successfully");
        // Connection event listeners
        mongoose_1.default.connection.on("connected", () => {
            isConnected = true;
            console.log("🔗 Mongoose connected to MongoDB");
        });
        mongoose_1.default.connection.on("error", (err) => {
            isConnected = false;
            console.error("❌ MongoDB connection error:", err);
        });
        mongoose_1.default.connection.on("disconnected", () => {
            isConnected = false;
            console.log("📴 Mongoose disconnected from MongoDB");
        });
    }
    catch (error) {
        isConnected = false;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("❌ MongoDB connection failed:", errorMessage);
        if (process.env.NODE_ENV === "production") {
            console.log("🔄 Retrying MongoDB connection in 5 seconds...");
            setTimeout(exports.connectDB, 5000);
        }
        else {
            process.exit(1);
        }
        throw error;
    }
});
exports.connectDB = connectDB;
// Close database connection
const closeConnection = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (isConnected) {
            yield mongoose_1.default.connection.close();
            isConnected = false;
            console.log("🔒 MongoDB connection closed");
        }
    }
    catch (error) {
        console.error("❌ Error closing MongoDB connection:", error);
    }
});
exports.closeConnection = closeConnection;
// Check connection status
const checkConnection = () => {
    return {
        isConnected,
        readyState: mongoose_1.default.connection.readyState,
        readyStateText: getReadyStateText(mongoose_1.default.connection.readyState),
    };
};
exports.checkConnection = checkConnection;
// Get readable connection state
const getReadyStateText = (readyState) => {
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    };
    return states[readyState] || "unknown";
};
exports.default = mongoose_1.default;
