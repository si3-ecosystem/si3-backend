import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

let cachedConnection = null;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.info("Using existing MongoDB connection");
      return;
    }

    if (cachedConnection) {
      console.info("Reusing cached MongoDB connection promise");
      await cachedConnection;
      return;
    }

    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      const errorMessage = "MONGO_URI not defined in environment variables";
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    cachedConnection = mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await cachedConnection;
    console.info("Successfully connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    cachedConnection = null;
    throw error;
  }
};

mongoose.connection.on("connected", () => {
  console.info("Mongoose connected to MongoDB");
});

mongoose.connection.on("disconnected", () => {
  console.warn("Mongoose disconnected from MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
  cachedConnection = null;
});

export default connectDB;
