import express from "express";
import { getDiversityTrackerSummary } from "../controllers/diversityTrackerController.js";

const router = express.Router();

// GET /api/diversity-tracker/summary
router.get("/summary", getDiversityTrackerSummary);

export default router;
