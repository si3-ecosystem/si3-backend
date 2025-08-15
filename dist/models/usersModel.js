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
exports.UserRole = exports.Platform = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Enums for type safety
var Platform;
(function (Platform) {
    Platform["OTHER"] = "other";
    Platform["GITHUB"] = "github";
    Platform["TWITTER"] = "twitter";
    Platform["WEBSITE"] = "website";
    Platform["LINKEDIN"] = "linkedin";
    Platform["FACEBOOK"] = "facebook";
    Platform["INSTAGRAM"] = "instagram";
    Platform["PORTFOLIO"] = "portfolio";
})(Platform || (exports.Platform = Platform = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["GUIDE"] = "guide";
    UserRole["SCHOLAR"] = "scholar";
    UserRole["PARTNER"] = "partner";
})(UserRole || (exports.UserRole = UserRole = {}));
// Digital link subdocument schema
const digitalLinkSchema = new mongoose_1.Schema({
    platform: {
        type: String,
        required: [true, "Platform is required"],
        enum: {
            values: Object.values(Platform),
            message: "Invalid platform selected",
        },
    },
    url: {
        type: String,
        required: [true, "URL is required"],
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
}, { _id: false });
// User schema definition
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
        validate: {
            validator: function (email) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: "Please provide a valid email address",
        },
    },
    username: {
        type: String,
        trim: true,
        // Removed lowercase: true to preserve original case
        minlength: [3, "Username must be at least 3 characters long"],
        maxlength: [30, "Username cannot exceed 30 characters"],
        validate: {
            validator: function (username) {
                if (!username)
                    return true; // Optional field
                // Username can contain letters, numbers, underscores, and hyphens
                return /^[a-zA-Z0-9_-]+$/.test(username);
            },
            message: "Username can only contain letters, numbers, underscores, and hyphens",
        },
        sparse: true, // Allow multiple null values but enforce uniqueness for non-null values
        unique: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
        index: true,
    },
    isWalletVerified: {
        type: Boolean,
        default: false,
        index: true,
    },
    lastLogin: {
        type: Date,
        default: null,
    },
    wallet_address: {
        type: String,
        trim: true,
        validate: {
            validator: function (address) {
                if (!address)
                    return true; // Optional field
                // Basic ethereum address validation (starts with 0x and 42 chars total)
                return /^0x[a-fA-F0-9]{40}$/.test(address);
            },
            message: "Please provide a valid wallet address",
        },
    },
    roles: {
        type: [String],
        required: [true, "At least one role is required"],
        enum: {
            values: Object.values(UserRole),
            message: "Invalid role selected",
        },
        validate: {
            validator: function (roles) {
                return Array.isArray(roles) && roles.length > 0;
            },
            message: "At least one role must be assigned",
        },
    },
    companyAffiliation: {
        type: String,
        trim: true,
        maxlength: [200, "Company affiliation cannot exceed 200 characters"],
    },
    interests: {
        type: [String],
        default: [],
        validate: {
            validator: function (interests) {
                return interests.every((interest) => interest.trim().length > 0);
            },
            message: "Interests cannot be empty strings",
        },
    },
    personalValues: {
        type: [String],
        default: [],
        validate: {
            validator: function (values) {
                return values.every((value) => value.trim().length > 0);
            },
            message: "Personal values cannot be empty strings",
        },
    },
    digitalLinks: {
        type: [digitalLinkSchema],
        default: [],
        validate: {
            validator: function (links) {
                // Check for duplicate platforms
                const platforms = links.map((link) => link.platform);
                return platforms.length === new Set(platforms).size;
            },
            message: "Duplicate platforms are not allowed",
        },
    },
    companyName: {
        type: String,
        trim: true,
        maxlength: [200, "Company name cannot exceed 200 characters"],
    },
    details: {
        type: String,
        trim: true,
        maxlength: [1000, "Details cannot exceed 1000 characters"],
    },
    newsletter: {
        type: Boolean,
        default: false,
    },
    // New fields for settings page
    notificationSettings: {
        emailUpdates: {
            type: Boolean,
            default: true,
        },
        sessionReminder: {
            type: Boolean,
            default: true,
        },
        marketingEmails: {
            type: Boolean,
            default: false,
        },
        weeklyDigest: {
            type: Boolean,
            default: true,
        },
        eventAnnouncements: {
            type: Boolean,
            default: true,
        },
    },
    walletInfo: {
        address: {
            type: String,
            sparse: true,
            validate: {
                validator: function (address) {
                    if (!address)
                        return true; // Optional field
                    return /^0x[a-fA-F0-9]{40}$/.test(address);
                },
                message: "Please provide a valid Ethereum address",
            },
        },
        connectedWallet: {
            type: String,
            enum: ["Zerion", "MetaMask", "WalletConnect", "Other"],
        },
        network: {
            type: String,
            enum: ["Mainnet", "Polygon", "Arbitrum", "Base", "Optimism"],
            default: "Mainnet",
        },
        connectedAt: {
            type: Date,
        },
        lastUsed: {
            type: Date,
        },
    },
    settingsUpdatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    collection: "si3Users",
});
// Essential indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ roles: 1 });
userSchema.index({ wallet_address: 1 }, { sparse: true });
userSchema.index({ isVerified: 1, createdAt: -1 });
userSchema.index({ isWalletVerified: 1, createdAt: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ "walletInfo.address": 1 }, { sparse: true });
userSchema.index({ settingsUpdatedAt: -1 });
// Essential pre-save middleware
userSchema.pre("save", function (next) {
    // Clean interests array
    if (this.interests && Array.isArray(this.interests)) {
        this.interests = this.interests
            .map((interest) => interest.trim())
            .filter((interest) => interest.length > 0);
    }
    // Clean personal values array
    if (this.personalValues && Array.isArray(this.personalValues)) {
        this.personalValues = this.personalValues
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
    }
    // Auto-add https:// to digital links if missing
    if (this.digitalLinks && Array.isArray(this.digitalLinks)) {
        this.digitalLinks.forEach((link) => {
            if (link.url && !link.url.startsWith("http")) {
                link.url = `https://${link.url}`;
            }
        });
    }
    // Update lastLogin if user is being verified (email or wallet)
    if ((this.isModified("isVerified") && this.isVerified) ||
        (this.isModified("isWalletVerified") && this.isWalletVerified)) {
        if (!this.lastLogin) {
            this.lastLogin = new Date();
        }
    }
    next();
});
// Error handling for duplicate email
userSchema.post("save", function (error, doc, next) {
    if (error.name === "MongoServerError" && error.code === 11000) {
        next(new Error("A user with this email already exists"));
    }
    else {
        next(error);
    }
});
// Create and export model
const UserModel = mongoose_1.default.model("SI3-User", userSchema);
exports.default = UserModel;
