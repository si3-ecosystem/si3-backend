import express from "express";
import { sendBasicEmail } from "../controllers/mailController.js";

const router = express.Router();

// Basic email sending route
router.post("/basic", sendBasicEmail);

export default router;
