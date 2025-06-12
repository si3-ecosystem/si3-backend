import dotenv from "dotenv";
import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";

import allowedOrigins from "./allowedOrigins.js";

import mailRoutes from "./routes/mailRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import diversityTrackerRoutes from "./routes/diversityTrackerRoutes.js";

import AppError from "./utils/AppError.js";

import errorController from "./controllers/errorController.js";

import { mainMiddleware } from "./middleware/mainMiddleware.js";

dotenv.config({ path: "./.env" });

const app = express();

try {
  await connectDB();
} catch (error) {
  console.error("Failed to connect to database. Exiting...", error);
  process.exit(1);
}

app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "50kb" }));
app.disable("x-powered-by");

if (process.env.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:3000", "http://localhost:8080");
}

mainMiddleware(app);

app.get("/", (req, res) => {
  res.send("SI<3> Server is running");
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "SI<3> Server is running",
  });
});

app.use("/api/mail", mailRoutes);
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/diversity-tracker", diversityTrackerRoutes);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

app.use(errorController);

export default app;
