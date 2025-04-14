import dotenv from "dotenv";
import throng from "throng";
import express from "express";
// import redis from "./utils/redis.js";

import AppError from "./utils/AppError.js";

import errorController from "./controller/errorController.js";

import allowedOrigins from "./allowedOrigins.js";
import { mainMiddleware } from "./middleware/mainMiddleware.js";

// Load environment variables
dotenv.config({ path: "./.env" });
const workers = process.env.WEB_CONCURRENCY || 5;

async function startWorker(id) {
  const PORT = process.env.PORT || 5000;
  const app = express();

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
      workerId: id,
    });
  });

  const server = app.listen(PORT, () => {
    console.log(`SI<3> Server worker ${id} is initialized on port ${PORT}`);
  });

  process.on("SIGTERM", async () => {
    console.log(`Worker ${id} exiting...`);
    // Perform cleanup
    try {
      // Cancel any pending jobs gracefully
      const { cleanup } = await import("./utils/queue.js");
      await cleanup();
    } catch (error) {
      console.error(`Error during worker ${id} cleanup:`, error);
    }
    process.exit();
  });

  app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
  });

  // All routes above this
  app.use(errorController);
}

throng({
  workers,
  start: startWorker,
});
