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
exports.getCalendarLinks = exports.downloadCalendarInvitation = exports.sendEventReminder = exports.sendRSVPEmail = exports.getWaitlistPosition = exports.joinWaitlist = exports.checkEventAvailability = exports.getEventAttendees = exports.getEventRSVPStats = exports.deleteRSVP = exports.updateRSVP = exports.getRSVPById = exports.getUserRSVPs = exports.createRSVP = void 0;
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const { eventId, status, guestCount, dietaryRestrictions, specialRequests, contactInfo } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    console.log(`🎫 Creating RSVP for user ${userId} and event ${eventId}`);
    console.log(`📝 Request body:`, JSON.stringify(req.body, null, 2));
    if (!userId) {
        return next(new AppError_1.default("User authentication required", 401));
    }
    // Step 1: Validate event and RSVP settings from Sanity
    console.log(`🔍 Step 1: Fetching event data from Sanity for eventId: ${eventId}`);
    const event = yield sanity_1.SanityEventService.validateEventForRSVP(eventId);
    console.log(`📊 Step 1 Result - Event data from Sanity:`, JSON.stringify({
        eventId: event._id,
        title: event.title,
        rsvpSettings: event.rsvpSettings,
        hasRsvpSettings: !!event.rsvpSettings,
        maxGuestsPerRSVP: (_b = event.rsvpSettings) === null || _b === void 0 ? void 0 : _b.maxGuestsPerRSVP,
        maxCapacity: (_c = event.rsvpSettings) === null || _c === void 0 ? void 0 : _c.maxCapacity,
        waitlistEnabled: (_d = event.rsvpSettings) === null || _d === void 0 ? void 0 : _d.waitlistEnabled,
        enabled: (_e = event.rsvpSettings) === null || _e === void 0 ? void 0 : _e.enabled
    }, null, 2));
    // Step 2: Check if user already has an RSVP for this event
    console.log(`🔍 Step 2: Checking for existing RSVP for user ${userId} and event ${eventId}`);
    const existingRSVP = yield rsvpModel_1.default.findOne({ eventId, userId });
    console.log(`📊 Step 2 Result - Existing RSVP:`, existingRSVP ? {
        id: existingRSVP._id,
        status: existingRSVP.status,
        guestCount: existingRSVP.guestCount
    } : 'None found');
    if (existingRSVP) {
        console.log(`❌ User already has RSVP for this event`);
        return next(new AppError_1.default("You have already RSVP'd for this event", 400));
    }
    // Step 3: Validate guest count
    console.log(`🔍 Step 3: Validating guest count`);
    console.log(`📊 Guest count validation:`, {
        requestedGuestCount: guestCount,
        maxGuestsPerRSVP: (_f = event.rsvpSettings) === null || _f === void 0 ? void 0 : _f.maxGuestsPerRSVP,
        isMaxGuestsNull: ((_g = event.rsvpSettings) === null || _g === void 0 ? void 0 : _g.maxGuestsPerRSVP) === null,
        isMaxGuestsUndefined: ((_h = event.rsvpSettings) === null || _h === void 0 ? void 0 : _h.maxGuestsPerRSVP) === undefined,
        typeOfMaxGuests: typeof ((_j = event.rsvpSettings) === null || _j === void 0 ? void 0 : _j.maxGuestsPerRSVP)
    });
    // Handle null/undefined maxGuestsPerRSVP with default value
    const maxGuestsPerRSVP = ((_k = event.rsvpSettings) === null || _k === void 0 ? void 0 : _k.maxGuestsPerRSVP) || 5; // Default to 5 if not set
    console.log(`📊 Using maxGuestsPerRSVP: ${maxGuestsPerRSVP} (${((_l = event.rsvpSettings) === null || _l === void 0 ? void 0 : _l.maxGuestsPerRSVP) ? 'from Sanity' : 'default value'})`);
    if (guestCount > maxGuestsPerRSVP) {
        console.log(`❌ Guest count validation failed: ${guestCount} > ${maxGuestsPerRSVP}`);
        return next(new AppError_1.default(`Maximum ${maxGuestsPerRSVP} guests allowed per RSVP`, 400));
    }
    console.log(`✅ Guest count validation passed: ${guestCount} <= ${maxGuestsPerRSVP}`);
    // Step 4: Check event capacity if attending
    if (status === rsvpModel_1.RSVPStatus.ATTENDING && ((_m = event.rsvpSettings) === null || _m === void 0 ? void 0 : _m.maxCapacity)) {
        console.log(`🔍 Step 4: Checking event capacity for attending status`);
        console.log(`📊 Capacity check:`, {
            status: status,
            maxCapacity: event.rsvpSettings.maxCapacity,
            requestedGuestCount: guestCount
        });
        const stats = yield rsvpModel_1.default.getEventStats(eventId);
        console.log(`📊 Current event stats:`, JSON.stringify(stats, null, 2));
        const totalAttending = stats.totalGuests + guestCount;
        console.log(`📊 Capacity calculation:`, {
            currentTotalGuests: stats.totalGuests,
            requestedGuestCount: guestCount,
            totalAfterRSVP: totalAttending,
            maxCapacity: event.rsvpSettings.maxCapacity,
            wouldExceedCapacity: totalAttending > event.rsvpSettings.maxCapacity
        });
        if (totalAttending > event.rsvpSettings.maxCapacity) {
            console.log(`⚠️ Event would exceed capacity: ${totalAttending} > ${event.rsvpSettings.maxCapacity}`);
            if (event.rsvpSettings.waitlistEnabled) {
                console.log(`📝 Adding to waitlist (waitlist enabled)`);
                // Add to waitlist
                const waitlistPosition = yield rsvpModel_1.default.getNextWaitlistPosition(eventId);
                console.log(`📊 Waitlist position: ${waitlistPosition}`);
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
                console.log(`✅ RSVP created on waitlist:`, {
                    id: rsvp._id,
                    status: rsvp.status,
                    waitlistPosition: rsvp.waitlistPosition
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
                console.log(`❌ Event at capacity and waitlist disabled`);
                return next(new AppError_1.default("Event is at full capacity", 400));
            }
        }
        else {
            console.log(`✅ Event has capacity, proceeding with regular RSVP`);
        }
    }
    else {
        console.log(`🔍 Step 4 skipped: Not attending or no max capacity set`);
    }
    // Step 5: Create RSVP
    console.log(`🔍 Step 5: Creating RSVP in MongoDB`);
    const rsvpData = {
        eventId,
        userId,
        status,
        guestCount,
        dietaryRestrictions,
        specialRequests,
        contactInfo,
        approvalStatus: ((_o = event.rsvpSettings) === null || _o === void 0 ? void 0 : _o.requiresApproval) ? 'pending' : 'approved'
    };
    console.log(`📊 RSVP data to be created:`, JSON.stringify(rsvpData, null, 2));
    const rsvp = yield rsvpModel_1.default.create(rsvpData);
    console.log(`✅ RSVP created in MongoDB:`, {
        id: rsvp._id,
        eventId: rsvp.eventId,
        userId: rsvp.userId,
        status: rsvp.status,
        guestCount: rsvp.guestCount,
        approvalStatus: rsvp.approvalStatus
    });
    yield rsvp.populate('user', 'email roles');
    const populatedRSVP = rsvp;
    console.log(`📊 RSVP populated with user data:`, {
        id: populatedRSVP._id,
        userEmail: (_p = populatedRSVP.user) === null || _p === void 0 ? void 0 : _p.email,
        userRoles: (_q = populatedRSVP.user) === null || _q === void 0 ? void 0 : _q.roles
    });
    // Step 6: Clear cache
    console.log(`🔍 Step 6: Clearing Redis cache`);
    yield redisHelper_1.default.cacheDelete(`event_stats_${eventId}`);
    yield redisHelper_1.default.cacheDelete(`user_rsvps_${userId}`);
    console.log(`✅ Cache cleared for event ${eventId} and user ${userId}`);
    console.log(`🎉 RSVP creation completed successfully!`);
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
