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
const guideSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [1, "Name must be at least 1 character"],
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
    daoInterests: {
        type: String,
        required: [true, "DAO interests are required"],
        trim: true,
        minlength: [1, "DAO interests must be at least 1 character"],
        maxlength: [100, "DAO interests cannot exceed 100 characters"],
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
    personalValues: {
        type: String,
        required: [true, "Personal values are required"],
        trim: true,
        minlength: [1, "Personal values must be at least 1 character"],
        maxlength: [2000, "Personal values cannot exceed 2000 characters"],
    },
    digitalLink: {
        type: String,
        required: [true, "Digital link is required"],
        trim: true,
        validate: {
            validator: function (url) {
                try {
                    new URL(url);
                    return true;
                }
                catch (_a) {
                    return false;
                }
            },
            message: "Please provide a valid URL",
        },
    },
}, {
    timestamps: true,
    collection: "guides",
});
// Essential indexes only
guideSchema.index({ createdAt: -1 });
guideSchema.index({ email: 1 }, { unique: true });
// Essential pre-save middleware
guideSchema.pre("save", function (next) {
    // Clean interests array
    if (this.interests && Array.isArray(this.interests)) {
        this.interests = this.interests
            .map((interest) => interest.trim())
            .filter((interest) => interest.length > 0);
    }
    // Auto-add https:// if missing
    if (this.digitalLink && !this.digitalLink.startsWith("http")) {
        this.digitalLink = `https://${this.digitalLink}`;
    }
    next();
});
// Error handling for duplicate email
guideSchema.post("save", function (error, doc, next) {
    if (error.name === "MongoServerError" && error.code === 11000) {
        next(new Error("A guide with this email already exists"));
    }
    else {
        next(error);
    }
});
// Create and export model
const GuideModel = mongoose_1.default.model("Guide", guideSchema);
exports.default = GuideModel;
