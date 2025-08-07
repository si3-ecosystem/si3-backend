"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarLinks = exports.downloadCalendarInvitation = exports.downloadPublicCalendarInvitation = exports.sendEventReminder = exports.sendRSVPEmail = exports.debugCurrentUser = exports.resendRSVPEmail = exports.debugRSVPEmail = exports.getWaitlistPosition = exports.joinWaitlist = exports.checkEventAvailability = exports.getEventAttendees = exports.getEventRSVPStats = exports.deleteRSVP = exports.updateRSVP = exports.getRSVPById = exports.getUserRSVPs = exports.createRSVP = void 0;
const rsvpModel_1 = __importStar(require("../models/rsvpModel"));
const usersModel_1 = require("../models/usersModel");
const sanity_1 = require("../config/sanity");
const rsvpEmailService_1 = __importDefault(require("../services/rsvpEmailService"));
const calendarService_1 = __importDefault(require("../services/calendarService"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const redisHelper_1 = __importDefault(require("../helpers/redisHelper"));
/**
 * @desc    Create new RSVP
 * @route   POST /api/rsvp
 * @access  Private
 */
exports.createRSVP = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { eventId, status, guestCount, dietaryRestrictions, specialRequests, contactInfo } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return next(new AppError_1.default("User authentication required", 401));
    }
    // Validate user has a real email address (not wallet temp email)
    const userEmail = (_b = req.user) === null || _b === void 0 ? void 0 : _b.email;
    if (!userEmail || userEmail.includes('@wallet.temp')) {
        return next(new AppError_1.default("No valid email found for this user. Please update your email address to receive RSVP confirmations and event notifications.", 400));
    }
    // Validate event and RSVP settings from Sanity
    const event = yield sanity_1.SanityEventService.validateEventForRSVP(eventId);
    // Check if user already has an RSVP for this event
    const existingRSVP = yield rsvpModel_1.default.findOne({ eventId, userId });
    if (existingRSVP) {
        return next(new AppError_1.default("You have already RSVP'd for this event", 400));
    }
    // Validate guest count with fallback for null values
    const maxGuestsPerRSVP = ((_c = event.rsvpSettings) === null || _c === void 0 ? void 0 : _c.maxGuestsPerRSVP) || 5;
    if (guestCount > maxGuestsPerRSVP) {
        return next(new AppError_1.default(`Maximum ${maxGuestsPerRSVP} guests allowed per RSVP`, 400));
    }
    // Check event capacity if attending
    if (status === rsvpModel_1.RSVPStatus.ATTENDING && ((_d = event.rsvpSettings) === null || _d === void 0 ? void 0 : _d.maxCapacity)) {
        const stats = yield rsvpModel_1.default.getEventStats(eventId);
        const totalAttending = stats.totalGuests + guestCount;
        if (totalAttending > event.rsvpSettings.maxCapacity) {
            if (event.rsvpSettings.waitlistEnabled) {
                // Add to waitlist
                const waitlistPosition = yield rsvpModel_1.default.getNextWaitlistPosition(eventId);
                const rsvp = yield rsvpModel_1.default.create({
                    eventId,
                    userId,
                    status: rsvpModel_1.RSVPStatus.WAITLISTED,
                    guestCount,
                    dietaryRestrictions,
                    specialRequests,
                    contactInfo,
                    waitlistPosition,
                    approvalStatus: 'approved'
                });
                // Clear cache
                yield redisHelper_1.default.cacheDelete(`event_stats_${eventId}`);
                return res.status(201).json({
                    status: "success",
                    message: "Added to waitlist successfully",
                    data: rsvp
                });
            }
            else {
                return next(new AppError_1.default("Event is at full capacity", 400));
            }
        }
    }
    // Create RSVP
    const rsvpData = {
        eventId,
        userId,
        status,
        guestCount,
        dietaryRestrictions,
        specialRequests,
        contactInfo,
        approvalStatus: ((_e = event.rsvpSettings) === null || _e === void 0 ? void 0 : _e.requiresApproval) ? 'pending' : 'approved'
    };
    const rsvp = yield rsvpModel_1.default.create(rsvpData);
    yield rsvp.populate('user', 'email roles');
    const populatedRSVP = rsvp;
    // Clear cache
    yield redisHelper_1.default.cacheDelete(`event_stats_${eventId}`);
    yield redisHelper_1.default.cacheDelete(`user_rsvps_${userId}`);
    // Send confirmation email with calendar attachment
    try {
        const RSVPEmailService = yield Promise.resolve().then(() => __importStar(require("../services/rsvpEmailService")));
        const emailSent = yield RSVPEmailService.default.sendConfirmationEmail(populatedRSVP._id.toString(), "Thank you for your RSVP! We're excited to see you at the event.");
        if (emailSent) {
            // Update RSVP to mark confirmation email as sent
            yield rsvpModel_1.default.findByIdAndUpdate(populatedRSVP._id, {
                confirmationEmailSent: true
            });
        }
    }
    catch (emailError) {
        // Don't fail the RSVP creation if email fails
        console.error('Error sending confirmation email:', emailError);
    }
    res.status(201).json({
        status: "success",
        message: "RSVP created successfully",
        data: populatedRSVP
    });
}));
/**
 * @desc    Get user's RSVPs
 * @route   GET /api/rsvp/my-rsvps
 * @access  Private
 */
exports.getUserRSVPs = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { page = 1, limit = 10, status } = req.query;
    if (!userId) {
        return next(new AppError_1.default("User authentication required", 401));
    }
    // Build query
    const query = { userId };
    if (status) {
        query.status = status;
    }
    // Check cache first
    const cacheKey = `user_rsvps_${userId}_${page}_${limit}_${status || 'all'}`;
    const cachedRSVPs = yield redisHelper_1.default.cacheGet(cacheKey);
    if (cachedRSVPs) {
        return res.status(200).json({
            status: "success",
            data: cachedRSVPs
        });
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [rsvps, total] = yield Promise.all([
        rsvpModel_1.default.find(query)
            .populate('user', 'email roles')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        rsvpModel_1.default.countDocuments(query)
    ]);
    const result = {
        rsvps,
        pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
            hasNext: skip + Number(limit) < total,
            hasPrev: Number(page) > 1
        }
    };
    // Cache for 5 minutes
    yield redisHelper_1.default.cacheSet(cacheKey, result, 300);
    res.status(200).json({
        status: "success",
        data: result
    });
}));
/**
 * @desc    Get RSVP by ID
 * @route   GET /api/rsvp/:id
 * @access  Private
 */
exports.getRSVPById = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return next(new AppError_1.default("User authentication required", 401));
    }
    const rsvp = yield rsvpModel_1.default.findById(id).populate('user', 'email roles');
    if (!rsvp) {
        return next(new AppError_1.default("RSVP not found", 404));
    }
    // Check if user owns this RSVP or is admin
    const isOwner = rsvp.userId.toString() === userId.toString();
    const isAdmin = (_b = req.user) === null || _b === void 0 ? void 0 : _b.roles.includes(usersModel_1.UserRole.ADMIN);
    if (!isOwner && !isAdmin) {
        return next(new AppError_1.default("Not authorized to view this RSVP", 403));
    }
    res.status(200).json({
        status: "success",
        data: rsvp
    });
}));
/**
 * @desc    Update RSVP
 * @route   PUT /api/rsvp/:id
 * @access  Private
 */
exports.updateRSVP = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { status, guestCount, dietaryRestrictions, specialRequests, contactInfo } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return next(new AppError_1.default("User authentication required", 401));
    }
    const rsvp = yield rsvpModel_1.default.findById(id);
    if (!rsvp) {
        return next(new AppError_1.default("RSVP not found", 404));
    }
    // Check ownership
    if (rsvp.userId.toString() !== userId.toString()) {
        return next(new AppError_1.default("Not authorized to update this RSVP", 403));
    }
    // Validate event is still accepting RSVPs
    const event = yield sanity_1.SanityEventService.validateEventForRSVP(rsvp.eventId);
    // If changing to attending, check capacity
    if (status === rsvpModel_1.RSVPStatus.ATTENDING && rsvp.status !== rsvpModel_1.RSVPStatus.ATTENDING && event.rsvpSettings.maxCapacity) {
        const stats = yield rsvpModel_1.default.getEventStats(rsvp.eventId);
        const additionalGuests = guestCount; // New guests being added
        if (stats.totalGuests + additionalGuests > event.rsvpSettings.maxCapacity) {
            return next(new AppError_1.default("Event is at full capacity", 400));
        }
    }
    // Update RSVP
    const updatedRSVP = yield rsvpModel_1.default.findByIdAndUpdate(id, Object.assign({ status,
        guestCount,
        dietaryRestrictions,
        specialRequests,
        contactInfo }, (status !== rsvp.status && { approvalStatus: event.rsvpSettings.requiresApproval ? 'pending' : 'approved' })), { new: true, runValidators: true }).populate('user', 'email roles');
    // Clear cache
    yield redisHelper_1.default.cacheDelete(`event_stats_${rsvp.eventId}`);
    yield redisHelper_1.default.cacheDelete(`user_rsvps_${userId}`);
    res.status(200).json({
        status: "success",
        message: "RSVP updated successfully",
        data: updatedRSVP
    });
}));
/**
 * @desc    Delete RSVP
 * @route   DELETE /api/rsvp/:id
 * @access  Private
 */
exports.deleteRSVP = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return next(new AppError_1.default("User authentication required", 401));
    }
    const rsvp = yield rsvpModel_1.default.findById(id);
    if (!rsvp) {
        return next(new AppError_1.default("RSVP not found", 404));
    }
    // Check ownership or admin
    const isOwner = rsvp.userId.toString() === userId.toString();
    const isAdmin = (_b = req.user) === null || _b === void 0 ? void 0 : _b.roles.includes(usersModel_1.UserRole.ADMIN);
    if (!isOwner && !isAdmin) {
        return next(new AppError_1.default("Not authorized to delete this RSVP", 403));
    }
    yield rsvpModel_1.default.findByIdAndDelete(id);
    // Clear cache
    yield redisHelper_1.default.cacheDelete(`event_stats_${rsvp.eventId}`);
    yield redisHelper_1.default.cacheDelete(`user_rsvps_${rsvp.userId}`);
    res.status(200).json({
        status: "success",
        message: "RSVP deleted successfully"
    });
}));
/**
 * @desc    Get event RSVP statistics
 * @route   GET /api/rsvp/event/:eventId/stats
 * @access  Public
 */
exports.getEventRSVPStats = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { eventId } = req.params;
    // Check cache first
    const cacheKey = `event_stats_${eventId}`;
    const cachedStats = yield redisHelper_1.default.cacheGet(cacheKey);
    if (cachedStats) {
        return res.status(200).json({
            status: "success",
            data: cachedStats
        });
    }
    // Validate event exists
    const event = yield sanity_1.SanityEventService.getEventById(eventId);
    if (!event) {
        return next(new AppError_1.default("Event not found", 404));
    }
    // Get RSVP statistics
    const stats = yield rsvpModel_1.default.getEventStats(eventId);
    // Calculate additional metrics
    const maxCapacity = (_a = event.rsvpSettings) === null || _a === void 0 ? void 0 : _a.maxCapacity;
    const availableSpots = maxCapacity ? Math.max(0, maxCapacity - stats.totalGuests) : null;
    const isAtCapacity = maxCapacity ? stats.totalGuests >= maxCapacity : false;
    const result = {
        eventId,
        eventTitle: event.title,
        eventDate: event.eventDate,
        maxCapacity,
        waitlistEnabled: ((_b = event.rsvpSettings) === null || _b === void 0 ? void 0 : _b.waitlistEnabled) || false,
        rsvpDeadline: (_c = event.rsvpSettings) === null || _c === void 0 ? void 0 : _c.rsvpDeadline,
        stats: Object.assign(Object.assign({}, stats), { availableSpots,
            isAtCapacity })
    };
    // Cache for 2 minutes
    yield redisHelper_1.default.cacheSet(cacheKey, result, 120);
    res.status(200).json({
        status: "success",
        data: result
    });
}));
/**
 * @desc    Get event attendees
 * @route   GET /api/rsvp/event/:eventId/attendees
 * @access  Public
 */
exports.getEventAttendees = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    const { page = 1, limit = 50, status = 'attending' } = req.query;
    // Validate event exists
    const event = yield sanity_1.SanityEventService.getEventById(eventId);
    if (!event) {
        return next(new AppError_1.default("Event not found", 404));
    }
    const skip = (Number(page) - 1) * Number(limit);
    const query = { eventId };
    if (status) {
        query.status = status;
    }
    const [attendees, total] = yield Promise.all([
        rsvpModel_1.default.find(query)
            .populate('user', 'email roles')
            .select('-adminNotes -approvedBy') // Hide sensitive fields
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        rsvpModel_1.default.countDocuments(query)
    ]);
    const result = {
        eventId,
        eventTitle: event.title,
        attendees,
        pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
            hasNext: skip + Number(limit) < total,
            hasPrev: Number(page) > 1
        }
    };
    res.status(200).json({
        status: "success",
        data: result
    });
}));
/**
 * @desc    Check event availability
 * @route   GET /api/rsvp/event/:eventId/availability
 * @access  Public
 */
exports.checkEventAvailability = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { eventId } = req.params;
    // Validate event exists
    const event = yield sanity_1.SanityEventService.getEventById(eventId);
    if (!event) {
        return next(new AppError_1.default("Event not found", 404));
    }
    const stats = yield rsvpModel_1.default.getEventStats(eventId);
    const maxCapacity = (_a = event.rsvpSettings) === null || _a === void 0 ? void 0 : _a.maxCapacity;
    const availability = {
        eventId,
        isRSVPOpen: ((_b = event.rsvpSettings) === null || _b === void 0 ? void 0 : _b.enabled) || false,
        hasCapacity: maxCapacity ? stats.totalGuests < maxCapacity : true,
        availableSpots: maxCapacity ? Math.max(0, maxCapacity - stats.totalGuests) : null,
        waitlistEnabled: ((_c = event.rsvpSettings) === null || _c === void 0 ? void 0 : _c.waitlistEnabled) || false,
        rsvpDeadline: (_d = event.rsvpSettings) === null || _d === void 0 ? void 0 : _d.rsvpDeadline,
        isDeadlinePassed: ((_e = event.rsvpSettings) === null || _e === void 0 ? void 0 : _e.rsvpDeadline) ?
            new Date(event.rsvpSettings.rsvpDeadline) < new Date() : false
    };
    res.status(200).json({
        status: "success",
        data: availability
    });
}));
/**
 * @desc    Join event waitlist
 * @route   POST /api/rsvp/waitlist/join
 * @access  Private
 */
exports.joinWaitlist = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { eventId, guestCount, notes } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return next(new AppError_1.default("User authentication required", 401));
    }
    // Validate event
    const event = yield sanity_1.SanityEventService.validateEventForRSVP(eventId);
    if (!event.rsvpSettings.waitlistEnabled) {
        return next(new AppError_1.default("Waitlist is not enabled for this event", 400));
    }
    // Check if user already has an RSVP
    const existingRSVP = yield rsvpModel_1.default.findOne({ eventId, userId });
    if (existingRSVP) {
        return next(new AppError_1.default("You have already RSVP'd for this event", 400));
    }
    // Get next waitlist position
    const waitlistPosition = yield rsvpModel_1.default.getNextWaitlistPosition(eventId);
    const rsvp = yield rsvpModel_1.default.create({
        eventId,
        userId,
        status: rsvpModel_1.RSVPStatus.WAITLISTED,
        guestCount,
        specialRequests: notes,
        waitlistPosition,
        approvalStatus: 'approved'
    });
    yield rsvp.populate('user', 'email roles');
    // Clear cache
    yield redisHelper_1.default.cacheDelete(`event_stats_${eventId}`);
    res.status(201).json({
        status: "success",
        message: "Successfully joined waitlist",
        data: rsvp
    });
}));
/**
 * @desc    Get waitlist position
 * @route   GET /api/rsvp/waitlist/:eventId/position
 * @access  Private
 */
exports.getWaitlistPosition = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { eventId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return next(new AppError_1.default("User authentication required", 401));
    }
    const rsvp = yield rsvpModel_1.default.findOne({
        eventId,
        userId,
        status: rsvpModel_1.RSVPStatus.WAITLISTED
    });
    if (!rsvp) {
        return next(new AppError_1.default("You are not on the waitlist for this event", 404));
    }
    // Get total waitlist count
    const totalWaitlisted = yield rsvpModel_1.default.countDocuments({
        eventId,
        status: rsvpModel_1.RSVPStatus.WAITLISTED
    });
    res.status(200).json({
        status: "success",
        data: {
            position: rsvp.waitlistPosition,
            totalWaitlisted,
            joinedAt: rsvp.waitlistJoinedAt
        }
    });
}));
/**
 * @desc    Debug RSVP email status and configuration
 * @route   GET /api/rsvp/:rsvpId/email-debug
 * @access  Private
 */
exports.debugRSVPEmail = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { rsvpId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return next(new AppError_1.default("User authentication required", 401));
    }
    // Get RSVP with user data
    const rsvp = yield rsvpModel_1.default.findById(rsvpId).populate('user', 'email roles');
    if (!rsvp) {
        return next(new AppError_1.default("RSVP not found", 404));
    }
    // Check if user has permission to debug this RSVP
    const isOwner = rsvp.userId.toString() === userId.toString();
    const isAdmin = (_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b.roles) === null || _c === void 0 ? void 0 : _c.includes(usersModel_1.UserRole.ADMIN);
    if (!isOwner && !isAdmin) {
        return next(new AppError_1.default("Not authorized to debug this RSVP", 403));
    }
    try {
        // Get event data from Sanity
        const event = yield sanity_1.SanityEventService.getEventById(rsvp.eventId);
        // Get SMTP status for events email type
        const emailService = yield Promise.resolve().then(() => __importStar(require("../config/protonMail")));
        const smtpStatus = emailService.default.getSMTPStatus();
        // Test SMTP connection for events
        let smtpConnectionTest = false;
        let smtpError = null;
        try {
            smtpConnectionTest = yield emailService.default.verifyConnection('rsvp');
        }
        catch (error) {
            smtpError = error.message;
        }
        // Check environment variables
        const envCheck = {
            SMTP_USERNAME_MEMBERS: !!process.env.SMTP_USERNAME_MEMBERS,
            SMTP_TOKEN_MEMBERS: !!process.env.SMTP_TOKEN_MEMBERS,
            SMTP_SERVER: process.env.SMTP_SERVER,
            SMTP_PORT: process.env.SMTP_PORT,
            API_BASE_URL: process.env.API_BASE_URL,
            BASE_URL: process.env.BASE_URL
        };
        const debugInfo = {
            rsvp: {
                id: rsvp._id,
                eventId: rsvp.eventId,
                userId: rsvp.userId,
                status: rsvp.status,
                confirmationEmailSent: rsvp.confirmationEmailSent,
                reminderEmailsSent: rsvp.reminderEmailsSent,
                approvalStatus: rsvp.approvalStatus,
                createdAt: rsvp.createdAt,
                updatedAt: rsvp.updatedAt
            },
            user: {
                email: rsvp.user.email,
                emailValid: isValidUserEmail(rsvp.user.email),
                isWalletEmail: rsvp.user.email.includes('@wallet.temp')
            },
            event: event ? {
                id: event._id,
                title: event.title,
                eventDate: event.eventDate,
                organizer: event.organizer
            } : null,
            emailConfig: {
                smtpStatus: smtpStatus.events || smtpStatus,
                smtpConnectionTest,
                smtpError,
                senderEmail: emailService.default.getSenderEmail('rsvp'),
                emailType: 'rsvp'
            },
            environment: envCheck,
            lastEmailAttempt: {
                // This would need to be tracked in a separate log table
                // For now, we can only show what we know from the RSVP record
                confirmationSent: rsvp.confirmationEmailSent,
                lastUpdated: rsvp.updatedAt
            }
        };
        res.status(200).json({
            status: "success",
            message: "RSVP email debug information retrieved",
            data: debugInfo,
            recommendations: generateEmailDebugRecommendations(debugInfo)
        });
    }
    catch (error) {
        console.error('Error in RSVP email debug:', error);
        return next(new AppError_1.default("Failed to retrieve debug information", 500));
    }
}));
/**
 * @desc    Resend RSVP confirmation email for debugging
 * @route   POST /api/rsvp/:rsvpId/resend-email
 * @access  Private
 */
exports.resendRSVPEmail = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { rsvpId } = req.params;
    const { emailType = 'confirmation', customMessage, force = false } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return next(new AppError_1.default("User authentication required", 401));
    }
    // Get RSVP with user data
    const rsvp = yield rsvpModel_1.default.findById(rsvpId).populate('user', 'email roles');
    if (!rsvp) {
        return next(new AppError_1.default("RSVP not found", 404));
    }
    // Check if user has permission to resend email for this RSVP
    const isOwner = rsvp.userId.toString() === userId.toString();
    const isAdmin = (_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b.roles) === null || _c === void 0 ? void 0 : _c.includes(usersModel_1.UserRole.ADMIN);
    if (!isOwner && !isAdmin) {
        return next(new AppError_1.default("Not authorized to resend email for this RSVP", 403));
    }
    try {
        const RSVPEmailService = yield Promise.resolve().then(() => __importStar(require("../services/rsvpEmailService")));
        let success = false;
        let message = "";
        let debugInfo = {};
        // Capture start time for performance tracking
        const startTime = Date.now();
        switch (emailType) {
            case 'confirmation':
                // Reset confirmation flag if force is true
                if (force) {
                    yield rsvpModel_1.default.findByIdAndUpdate(rsvpId, {
                        confirmationEmailSent: false
                    });
                }
                success = yield RSVPEmailService.default.sendConfirmationEmail(rsvpId, customMessage || "Debug resend: Thank you for your RSVP! We're excited to see you at the event.");
                message = success ? "Confirmation email resent successfully" : "Failed to resend confirmation email";
                break;
            case 'reminder':
                success = yield RSVPEmailService.default.sendReminderEmail(rsvpId, '24_hours', customMessage || "Debug resend: Reminder about your upcoming event.");
                message = success ? "Reminder email resent successfully" : "Failed to resend reminder email";
                break;
            default:
                return next(new AppError_1.default("Invalid email type. Use 'confirmation' or 'reminder'", 400));
        }
        const endTime = Date.now();
        const duration = endTime - startTime;
        // Get updated RSVP to check if flags were updated
        const updatedRSVP = yield rsvpModel_1.default.findById(rsvpId);
        debugInfo = {
            emailType,
            success,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            rsvpUpdated: {
                confirmationEmailSent: updatedRSVP === null || updatedRSVP === void 0 ? void 0 : updatedRSVP.confirmationEmailSent,
                reminderEmailsSent: updatedRSVP === null || updatedRSVP === void 0 ? void 0 : updatedRSVP.reminderEmailsSent
            }
        };
        res.status(success ? 200 : 500).json({
            status: success ? "success" : "error",
            message,
            data: debugInfo
        });
    }
    catch (error) {
        console.error('Error resending RSVP email:', error);
        return next(new AppError_1.default(`Failed to resend email: ${error.message}`, 500));
    }
}));
/**
 * @desc    Get current user info for debugging
 * @route   GET /api/rsvp/debug/current-user
 * @access  Private
 */
exports.debugCurrentUser = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return next(new AppError_1.default("User authentication required", 401));
    }
    try {
        // Get full user data
        const UserModel = yield Promise.resolve().then(() => __importStar(require("../models/usersModel")));
        const user = yield UserModel.default.findById(userId);
        if (!user) {
            return next(new AppError_1.default("User not found", 404));
        }
        // Get user's RSVPs for context
        const userRSVPs = yield rsvpModel_1.default.find({ userId }).sort({ createdAt: -1 }).limit(5);
        const debugInfo = {
            user: {
                id: user._id,
                email: user.email,
                emailValid: isValidUserEmail(user.email),
                isWalletEmail: user.email.includes('@wallet.temp'),
                roles: user.roles,
                isVerified: user.isVerified,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            },
            recentRSVPs: userRSVPs.map(rsvp => ({
                id: rsvp._id,
                eventId: rsvp.eventId,
                status: rsvp.status,
                confirmationEmailSent: rsvp.confirmationEmailSent,
                createdAt: rsvp.createdAt
            })),
            recommendations: []
        };
        // Generate recommendations
        if (debugInfo.user.isWalletEmail) {
            debugInfo.recommendations.push("User is using a wallet-based temporary email address. Consider updating to a real email address to receive notifications.");
        }
        if (!debugInfo.user.emailValid) {
            debugInfo.recommendations.push("User email format is invalid. Update the email address.");
        }
        if (!debugInfo.user.isVerified) {
            debugInfo.recommendations.push("User account is not verified. This might affect email delivery.");
        }
        res.status(200).json({
            status: "success",
            message: "Current user debug information",
            data: debugInfo
        });
    }
    catch (error) {
        console.error('Error in current user debug:', error);
        return next(new AppError_1.default("Failed to retrieve user debug information", 500));
    }
}));
// Helper function to check if email is valid (not wallet temp)
function isValidUserEmail(email) {
    if (!email)
        return false;
    if (email.includes('@wallet.temp'))
        return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
// Helper function to generate debug recommendations
function generateEmailDebugRecommendations(debugInfo) {
    const recommendations = [];
    // Check for wallet email first (highest priority)
    if (debugInfo.user.email && debugInfo.user.email.includes('@wallet.temp')) {
        recommendations.push("🚨 WALLET EMAIL DETECTED: User is using a temporary wallet email address (" + debugInfo.user.email + "). This is why emails aren't being received. The system now blocks RSVPs with wallet emails. User must update to a real email address.");
        return recommendations; // Return early as this is the main issue
    }
    if (!debugInfo.emailConfig.smtpStatus.isConfigured) {
        recommendations.push("SMTP configuration is incomplete. Check SMTP_USERNAME_MEMBERS and SMTP_TOKEN_MEMBERS environment variables.");
    }
    if (!debugInfo.emailConfig.smtpConnectionTest) {
        recommendations.push("SMTP connection test failed. Verify SMTP credentials and server settings.");
    }
    if (!debugInfo.user.emailValid) {
        recommendations.push("User email format appears invalid. Verify the email address.");
    }
    if (!debugInfo.event) {
        recommendations.push("Event data could not be retrieved from Sanity. Check event ID and Sanity connection.");
    }
    if (!debugInfo.environment.SMTP_USERNAME_MEMBERS || !debugInfo.environment.SMTP_TOKEN_MEMBERS) {
        recommendations.push("Missing required environment variables for events SMTP configuration.");
    }
    if (debugInfo.rsvp.confirmationEmailSent && !debugInfo.lastEmailAttempt.confirmationSent) {
        recommendations.push("Inconsistent email status. The confirmationEmailSent flag may not be accurate.");
    }
    if (recommendations.length === 0) {
        recommendations.push("Configuration appears correct. Email should be working. Check spam folder or try resending.");
    }
    return recommendations;
}
/**
 * @desc    Send RSVP email (confirmation, reminder, etc.)
 * @route   POST /api/rsvp/send-email
 * @access  Private
 */
exports.sendRSVPEmail = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { rsvpId, emailType, customMessage } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return next(new AppError_1.default("User authentication required", 401));
    }
    // Validate RSVP exists and user has permission
    const rsvp = yield rsvpModel_1.default.findById(rsvpId);
    if (!rsvp) {
        return next(new AppError_1.default("RSVP not found", 404));
    }
    const isOwner = rsvp.userId.toString() === userId.toString();
    const isAdmin = (_b = req.user) === null || _b === void 0 ? void 0 : _b.roles.includes(usersModel_1.UserRole.ADMIN);
    if (!isOwner && !isAdmin) {
        return next(new AppError_1.default("Not authorized to send emails for this RSVP", 403));
    }
    let success = false;
    let message = "";
    try {
        switch (emailType) {
            case 'confirmation':
                success = yield rsvpEmailService_1.default.sendConfirmationEmail(rsvpId, customMessage);
                message = "Confirmation email sent successfully";
                break;
            case 'reminder':
                success = yield rsvpEmailService_1.default.sendReminderEmail(rsvpId, '24_hours', customMessage);
                message = "Reminder email sent successfully";
                break;
            default:
                return next(new AppError_1.default("Invalid email type", 400));
        }
        if (!success) {
            return next(new AppError_1.default("Failed to send email", 500));
        }
        res.status(200).json({
            status: "success",
            message
        });
    }
    catch (error) {
        console.error('Email sending error:', error);
        return next(new AppError_1.default("Failed to send email", 500));
    }
}));
/**
 * @desc    Send event reminder to all attendees
 * @route   POST /api/rsvp/send-reminder
 * @access  Private (Admin only)
 */
exports.sendEventReminder = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { eventId, reminderType, customMessage } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return next(new AppError_1.default("User authentication required", 401));
    }
    // Check admin permission
    const isAdmin = (_b = req.user) === null || _b === void 0 ? void 0 : _b.roles.includes(usersModel_1.UserRole.ADMIN);
    if (!isAdmin) {
        return next(new AppError_1.default("Admin access required", 403));
    }
    // Validate event exists
    const event = yield sanity_1.SanityEventService.getEventById(eventId);
    if (!event) {
        return next(new AppError_1.default("Event not found", 404));
    }
    try {
        const results = yield rsvpEmailService_1.default.sendBulkReminders({
            eventId,
            reminderType,
            customMessage
        });
        res.status(200).json({
            status: "success",
            message: "Reminder emails sent",
            data: {
                sent: results.sent,
                failed: results.failed,
                errors: results.errors
            }
        });
    }
    catch (error) {
        console.error('Bulk reminder error:', error);
        return next(new AppError_1.default("Failed to send reminder emails", 500));
    }
}));
/**
 * @desc    Download calendar invitation for RSVP (Public with token)
 * @route   GET /api/rsvp/:id/calendar/public
 * @access  Public (with secure token)
 */
exports.downloadPublicCalendarInvitation = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { format = 'ics', token } = req.query;
    // Get RSVP
    const rsvp = yield rsvpModel_1.default.findById(id);
    if (!rsvp) {
        return next(new AppError_1.default("RSVP not found", 404));
    }
    // Verify token (simple token based on RSVP ID and user ID)
    const expectedToken = Buffer.from(`${rsvp._id}:${rsvp.userId}:${rsvp.eventId}`).toString('base64');
    if (token !== expectedToken) {
        return next(new AppError_1.default("Invalid calendar access token", 403));
    }
    // Only allow calendar download for attending users
    if (rsvp.status !== rsvpModel_1.RSVPStatus.ATTENDING) {
        return next(new AppError_1.default("Calendar invitations are only available for attending RSVPs", 400));
    }
    try {
        if (format === 'google') {
            // Redirect to Google Calendar
            const googleURL = yield calendarService_1.default.generateGoogleCalendarURL(id);
            return res.redirect(googleURL);
        }
        else if (format === 'outlook') {
            // Redirect to Outlook Calendar
            const outlookURL = yield calendarService_1.default.generateOutlookCalendarURL(id);
            return res.redirect(outlookURL);
        }
        else {
            // Generate and download ICS file
            const icsContent = yield calendarService_1.default.generateICSForRSVP(id);
            const filename = calendarService_1.default.generateFilename(`Event_${rsvp.eventId}`, id);
            res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Cache-Control', 'no-cache');
            res.send(icsContent);
        }
    }
    catch (error) {
        console.error('Calendar generation error:', error);
        return next(new AppError_1.default("Failed to generate calendar invitation", 500));
    }
}));
/**
 * @desc    Download calendar invitation for RSVP
 * @route   GET /api/rsvp/:id/calendar
 * @access  Private
 */
exports.downloadCalendarInvitation = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const { format = 'ics' } = req.query;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return next(new AppError_1.default("User authentication required", 401));
    }
    // Get RSVP and verify ownership
    const rsvp = yield rsvpModel_1.default.findById(id);
    if (!rsvp) {
        return next(new AppError_1.default("RSVP not found", 404));
    }
    const isOwner = rsvp.userId.toString() === userId.toString();
    const isAdmin = (_b = req.user) === null || _b === void 0 ? void 0 : _b.roles.includes(usersModel_1.UserRole.ADMIN);
    if (!isOwner && !isAdmin) {
        return next(new AppError_1.default("Not authorized to download calendar for this RSVP", 403));
    }
    // Only allow calendar download for attending users
    if (rsvp.status !== rsvpModel_1.RSVPStatus.ATTENDING) {
        return next(new AppError_1.default("Calendar invitations are only available for attending RSVPs", 400));
    }
    try {
        if (format === 'google') {
            // Redirect to Google Calendar
            const googleURL = yield calendarService_1.default.generateGoogleCalendarURL(id);
            return res.redirect(googleURL);
        }
        else if (format === 'outlook') {
            // Redirect to Outlook Calendar
            const outlookURL = yield calendarService_1.default.generateOutlookCalendarURL(id);
            return res.redirect(outlookURL);
        }
        else {
            // Generate and download ICS file
            const icsContent = yield calendarService_1.default.generateICSForRSVP(id);
            const filename = calendarService_1.default.generateCalendarFilename(`Event_${rsvp.eventId}`, id);
            res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Cache-Control', 'no-cache');
            res.send(icsContent);
        }
    }
    catch (error) {
        console.error('Calendar generation error:', error);
        return next(new AppError_1.default("Failed to generate calendar invitation", 500));
    }
}));
/**
 * @desc    Get calendar links for RSVP
 * @route   GET /api/rsvp/:id/calendar-links
 * @access  Private
 */
exports.getCalendarLinks = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return next(new AppError_1.default("User authentication required", 401));
    }
    // Get RSVP and verify ownership
    const rsvp = yield rsvpModel_1.default.findById(id);
    if (!rsvp) {
        return next(new AppError_1.default("RSVP not found", 404));
    }
    const isOwner = rsvp.userId.toString() === userId.toString();
    const isAdmin = (_b = req.user) === null || _b === void 0 ? void 0 : _b.roles.includes(usersModel_1.UserRole.ADMIN);
    if (!isOwner && !isAdmin) {
        return next(new AppError_1.default("Not authorized to access calendar links for this RSVP", 403));
    }
    // Only provide calendar links for attending users
    if (rsvp.status !== rsvpModel_1.RSVPStatus.ATTENDING) {
        return next(new AppError_1.default("Calendar links are only available for attending RSVPs", 400));
    }
    try {
        const baseURL = `${req.protocol}://${req.get('host')}/api/rsvp/${id}/calendar`;
        const calendarLinks = {
            ics: `${baseURL}?format=ics`,
            google: `${baseURL}?format=google`,
            outlook: `${baseURL}?format=outlook`,
            googleDirect: yield calendarService_1.default.generateGoogleCalendarURL(id),
            outlookDirect: yield calendarService_1.default.generateOutlookCalendarURL(id)
        };
        res.status(200).json({
            status: "success",
            data: calendarLinks
        });
    }
    catch (error) {
        console.error('Calendar links generation error:', error);
        return next(new AppError_1.default("Failed to generate calendar links", 500));
    }
}));
