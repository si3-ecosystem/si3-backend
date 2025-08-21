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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSVPStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Enums for RSVP status
var RSVPStatus;
(function (RSVPStatus) {
    RSVPStatus["ATTENDING"] = "attending";
    RSVPStatus["NOT_ATTENDING"] = "not_attending";
    RSVPStatus["MAYBE"] = "maybe";
    RSVPStatus["WAITLISTED"] = "waitlisted";
})(RSVPStatus || (exports.RSVPStatus = RSVPStatus = {}));
// Contact info schema
const contactInfoSchema = new mongoose_1.Schema({
    phone: {
        type: String,
        trim: true,
        validate: {
            validator: function (phone) {
                if (!phone)
                    return true; // Optional field
                // Basic phone validation (allows various formats)
                return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
            },
            message: "Please provide a valid phone number"
        }
    },
    emergencyContact: {
        type: String,
        trim: true,
        maxlength: [200, "Emergency contact cannot exceed 200 characters"]
    }
}, { _id: false });
// RSVP schema definition
const rsvpSchema = new mongoose_1.Schema({
    eventId: {
        type: String,
        required: [true, "Event ID is required"],
        trim: true,
        index: true,
        validate: {
            validator: function (eventId) {
                // Basic Sanity document ID validation (alphanumeric + hyphens)
                return /^[a-zA-Z0-9\-_]+$/.test(eventId);
            },
            message: "Please provide a valid Sanity event ID"
        }
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SI3-User",
        required: [true, "User ID is required"],
        index: true
    },
    status: {
        type: String,
        required: [true, "RSVP status is required"],
        enum: {
            values: Object.values(RSVPStatus),
            message: "Invalid RSVP status selected"
        },
        index: true
    },
    guestCount: {
        type: Number,
        required: [true, "Guest count is required"],
        min: [1, "Guest count must be at least 1"],
        max: [20, "Guest count cannot exceed 20"],
        default: 1
    },
    dietaryRestrictions: {
        type: String,
        trim: true,
        maxlength: [500, "Dietary restrictions cannot exceed 500 characters"]
    },
    specialRequests: {
        type: String,
        trim: true,
        maxlength: [1000, "Special requests cannot exceed 1000 characters"]
    },
    contactInfo: {
        type: contactInfoSchema,
        default: null
    },
    waitlistPosition: {
        type: Number,
        min: [1, "Waitlist position must be positive"],
        index: true,
        sparse: true // Only index non-null values
    },
    waitlistJoinedAt: {
        type: Date,
        index: true,
        sparse: true
    },
    adminNotes: {
        type: String,
        trim: true,
        maxlength: [2000, "Admin notes cannot exceed 2000 characters"]
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved', // Most events auto-approve
        index: true
    },
    approvedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SI3-User",
        sparse: true
    },
    approvedAt: {
        type: Date,
        sparse: true
    },
    confirmationEmailSent: {
        type: Boolean,
        default: false,
        index: true
    },
    reminderEmailsSent: {
        type: [String],
        default: [],
        validate: {
            validator: function (reminders) {
                const validTypes = ['24_hours', '1_week', '1_day', '2_hours'];
                return reminders.every(type => validTypes.includes(type));
            },
            message: "Invalid reminder type"
        }
    }
}, {
    timestamps: true,
    collection: "si3RSVPs"
});
// Compound indexes for optimal query performance
rsvpSchema.index({ eventId: 1, userId: 1 }, { unique: true }); // One RSVP per user per event
rsvpSchema.index({ eventId: 1, status: 1, createdAt: -1 });
rsvpSchema.index({ eventId: 1, waitlistPosition: 1 });
rsvpSchema.index({ userId: 1, status: 1, createdAt: -1 });
rsvpSchema.index({ status: 1, confirmationEmailSent: 1 });
rsvpSchema.index({ eventId: 1, approvalStatus: 1 });
// Virtual for populated user data
rsvpSchema.virtual("user", {
    ref: "SI3-User",
    localField: "userId",
    foreignField: "_id",
    justOne: true
});
// Pre-save middleware
rsvpSchema.pre("save", function (next) {
    // Set waitlist fields when status is waitlisted
    if (this.status === RSVPStatus.WAITLISTED && !this.waitlistJoinedAt) {
        this.waitlistJoinedAt = new Date();
    }
    // Clear waitlist fields when not waitlisted
    if (this.status !== RSVPStatus.WAITLISTED) {
        this.waitlistPosition = undefined;
        this.waitlistJoinedAt = undefined;
    }
    // Set approval timestamp
    if (this.isModified("approvalStatus") && this.approvalStatus === "approved" && !this.approvedAt) {
        this.approvedAt = new Date();
    }
    next();
});
// Static methods for common queries
rsvpSchema.statics.getEventStats = function (eventId) {
    return __awaiter(this, void 0, void 0, function* () {
        const stats = yield this.aggregate([
            { $match: { eventId } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalGuests: { $sum: "$guestCount" }
                }
            }
        ]);
        const result = {
            totalRSVPs: 0,
            attending: 0,
            notAttending: 0,
            maybe: 0,
            waitlisted: 0,
            totalGuests: 0
        };
        stats.forEach((stat) => {
            result.totalRSVPs += stat.count;
            switch (stat._id) {
                case RSVPStatus.ATTENDING:
                    result.attending = stat.count;
                    result.totalGuests += stat.totalGuests;
                    break;
                case RSVPStatus.NOT_ATTENDING:
                    result.notAttending = stat.count;
                    break;
                case RSVPStatus.MAYBE:
                    result.maybe = stat.count;
                    break;
                case RSVPStatus.WAITLISTED:
                    result.waitlisted = stat.count;
                    break;
            }
        });
        return result;
    });
};
rsvpSchema.statics.getNextWaitlistPosition = function (eventId) {
    return __awaiter(this, void 0, void 0, function* () {
        const lastPosition = yield this.findOne({ eventId, status: RSVPStatus.WAITLISTED }, { waitlistPosition: 1 }).sort({ waitlistPosition: -1 });
        return ((lastPosition === null || lastPosition === void 0 ? void 0 : lastPosition.waitlistPosition) || 0) + 1;
    });
};
// Error handling for duplicate RSVP
rsvpSchema.post("save", function (error, doc, next) {
    var _a, _b;
    if (error.name === "MongoServerError" && error.code === 11000) {
        console.log(`🚨 [RSVP MODEL DEBUG] MongoDB duplicate key error caught in post-save hook`);
        console.log(`   Error details:`, {
            name: error.name,
            code: error.code,
            message: error.message,
            keyPattern: error.keyPattern,
            keyValue: error.keyValue
        });
        console.log(`   Document being saved:`, {
            eventId: doc === null || doc === void 0 ? void 0 : doc.eventId,
            userId: doc === null || doc === void 0 ? void 0 : doc.userId,
            status: doc === null || doc === void 0 ? void 0 : doc.status,
            id: doc === null || doc === void 0 ? void 0 : doc._id
        });
        // Check if it's the eventId+userId constraint (actual duplicate RSVP)
        if (((_a = error.keyPattern) === null || _a === void 0 ? void 0 : _a.eventId) && ((_b = error.keyPattern) === null || _b === void 0 ? void 0 : _b.userId)) {
            next(new Error("User has already RSVP'd for this event"));
        }
        else {
            // For other duplicate key errors, provide more specific message
            const field = Object.keys(error.keyPattern || {})[0] || 'unknown field';
            next(new Error(`Duplicate value for ${field}. Please try again.`));
        }
    }
    else {
        next(error);
    }
});
// Create and export model
const RSVPModel = mongoose_1.default.model("RSVP", rsvpSchema);
exports.default = RSVPModel;
