import express from "express";
import {
  createOrUpdateRSVP,
  getUserRSVPs,
  getEventRSVPs,
  getEventStats,
  deleteRSVP,
  getUserEventRSVP,
  syncEventFromSanity,
} from "../controllers/rsvpController";

import {
  validateCreateRSVP,
  validateGetEventRSVPs,
  validateGetUserRSVPs,
  validateEventId,
  validateSyncEvent,
  validateEventStats,
} from "../validators/rsvpValidation";

import {
  checkSpecificEventAccess,
  checkRSVPManagementAccess,
  checkRSVPOwnership,
  checkSanitySync,
  checkEventCapacity,
  checkEventTiming,
} from "../middleware/rsvpPermissionMiddleware";

import { protect } from "../middleware/protectMiddleware";
import validationMiddleware from "../middleware/validationMiddleware";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// RSVP Management Routes
router
  .route("/")
  .post(
    validateCreateRSVP,
    validationMiddleware,
    checkSpecificEventAccess,
    checkEventCapacity,
    checkEventTiming,
    createOrUpdateRSVP
  );

// User's RSVPs
router
  .route("/my-rsvps")
  .get(
    validateGetUserRSVPs,
    validationMiddleware,
    checkRSVPOwnership,
    getUserRSVPs
  );

// Event-specific RSVP routes
router
  .route("/event/:eventId")
  .get(
    validateGetEventRSVPs,
    validationMiddleware,
    checkSpecificEventAccess,
    getEventRSVPs
  )
  .delete(
    validateEventId,
    validationMiddleware,
    checkSpecificEventAccess,
    deleteRSVP
  );

// Get user's RSVP for a specific event
router
  .route("/event/:eventId/my-rsvp")
  .get(
    validateEventId,
    validationMiddleware,
    checkSpecificEventAccess,
    getUserEventRSVP
  );

// Event statistics
router
  .route("/event/:eventId/stats")
  .get(
    validateEventStats,
    validationMiddleware,
    checkSpecificEventAccess,
    getEventStats
  );

// Admin-only routes for Sanity CMS integration
router
  .route("/sync/:eventId")
  .post(
    validateSyncEvent,
    validationMiddleware,
    checkSanitySync,
    syncEventFromSanity
  );

// Admin-only route to get all RSVPs for management
router
  .route("/admin/all")
  .get(
    validateGetUserRSVPs,
    validationMiddleware,
    checkRSVPManagementAccess,
    getUserRSVPs
  );

export default router;
