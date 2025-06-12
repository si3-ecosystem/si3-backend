// routes/userRoutes.js (updated to include profile management)
import express from "express";

import {
  getProfile,
  getAllUsers,
  updateProfile,
} from "../controllers/userController.js";

import { protect } from "../middleware/protectMiddleware.js";

const router = express.Router();

router.use(protect);

// Profile routes
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Admin routes
router.get("/", getAllUsers);

export default router;
