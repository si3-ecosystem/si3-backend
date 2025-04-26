import dotenv from "dotenv";
import express from "express";
import compression from "compression";

import AppError from "./utils/AppError.js";
import errorController from "./controllers/errorController.js";
import allowedOrigins from "./allowedOrigins.js";
import { mainMiddleware } from "./middleware/mainMiddleware.js";
import mailRoutes from "./routes/mailRoutes.js";
import connectDB from "./config/db.js";

dotenv.config({ path: "./.env" });

const app = express();

try {
  await connectDB();
} catch (error) {
  console.error("Failed to connect to database. Exiting...", error);
  process.exit(1);
}

app.use(compression());
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

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

app.use(errorController);

export default app;
