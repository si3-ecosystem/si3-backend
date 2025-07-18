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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Schema definition
const partnerProgramSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters"],
        maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        validate: {
            validator: function (email) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: "Please provide a valid email address",
        },
    },
    companyName: {
        type: String,
        required: [true, "Company name is required"],
        trim: true,
        minlength: [2, "Company name must be at least 2 characters"],
        maxlength: [200, "Company name cannot exceed 200 characters"],
    },
    interests: {
        type: [String],
        required: [true, "At least one interest is required"],
        validate: {
            validator: function (interests) {
                return Array.isArray(interests) && interests.length > 0;
            },
            message: "At least one interest must be provided",
        },
    },
    details: {
        type: String,
        trim: true,
        maxlength: [1000, "Details cannot exceed 1000 characters"],
    },
    newsletter: {
        type: Boolean,
        required: [true, "Newsletter preference is required"],
        default: false,
    },
}, {
    timestamps: true,
    collection: "partner",
});
// Essential indexes
partnerProgramSchema.index({ createdAt: -1 });
partnerProgramSchema.index({ email: 1 }, { unique: true });
partnerProgramSchema.index({ companyName: 1 });
// Essential pre-save middleware
partnerProgramSchema.pre("save", function (next) {
    // Clean interests array
    if (this.interests && Array.isArray(this.interests)) {
        this.interests = this.interests
            .map((interest) => interest.trim())
            .filter((interest) => interest.length > 0);
    }
    next();
});
// Error handling for duplicate email
partnerProgramSchema.post("save", function (error, doc, next) {
    if (error.name === "MongoServerError" && error.code === 11000) {
        const duplicateError = new Error("A partner with this email already exists");
        duplicateError.name = "ValidationError";
        duplicateError.statusCode = 400;
        next(duplicateError);
    }
    else {
        next(error);
    }
});
// Create and export model
const PartnerProgramModel = mongoose_1.default.model("Partner", partnerProgramSchema);
exports.default = PartnerProgramModel;
