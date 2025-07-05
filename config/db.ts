import mongoose from "mongoose";

// Simple connection state
let isConnected = false;

// MongoDB connection options
const mongooseOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Connect to database
export const connectDB = async (): Promise<void> => {
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

    await mongoose.connect(mongoURI, mongooseOptions);

    isConnected = true;
    console.log("✅ MongoDB connected successfully");

    // Connection event listeners
    mongoose.connection.on("connected", () => {
      isConnected = true;
      console.log("🔗 Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (err: Error) => {
      isConnected = false;
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      console.log("📴 Mongoose disconnected from MongoDB");
    });
  } catch (error) {
    isConnected = false;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ MongoDB connection failed:", errorMessage);

    if (process.env.NODE_ENV === "production") {
      console.log("🔄 Retrying MongoDB connection in 5 seconds...");
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }

    throw error;
  }
};

// Close database connection
export const closeConnection = async (): Promise<void> => {
  try {
    if (isConnected) {
      await mongoose.connection.close();
      isConnected = false;
      console.log("🔒 MongoDB connection closed");
    }
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error);
  }
};

// Check connection status
export const checkConnection = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    readyStateText: getReadyStateText(mongoose.connection.readyState),
  };
};

// Get readable connection state
const getReadyStateText = (readyState: number): string => {
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[readyState] || "unknown";
};

export default mongoose;
