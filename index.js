import dotenv from "dotenv";
import express from "express";
import serverless from "serverless-http";

// import redis from "./utils/redis.js";
import AppError from "./utils/AppError.js";

import errorController from "./controllers/errorController.js";

import allowedOrigins from "./allowedOrigins.js";
import { mainMiddleware } from "./middleware/mainMiddleware.js";

import mailRoutes from "./routes/mailRoutes.js";
import connectDB from "./config/db.js";

// Load environment variables
dotenv.config({ path: "./.env" });
// Initialize Express app
const app = express();

// Connect to the database before handling requests
connectDB().catch((error) => {
  console.error("Failed to connect to database. Exiting...", error);
  process.exit(1);
});

if (process.env.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:3000", "http://localhost:8080");
}

mainMiddleware(app);

app.get("/", (req, res) => {
  res.send("SI<3> Server is running");
});

// redis.on("error", (error) => {
//   console.error("Redis Error:", error);
// });

// redis.on("connect", async () => {
//   console.info("Successfully connected to Redis");
// });

app.get("/health", (req, res) => {
  return res.json({
    success: true,
    message: "SI<3> Server is running",
  });
});

// All Server Routes
app.use("/api/mail", mailRoutes);

// Error Routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

// All routes above this
app.use(errorController);

// Export serverless handler for Vercel
export default serverless(app);
