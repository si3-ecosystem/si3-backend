import mongoose, { Document, Schema } from "mongoose";

// Enums for type safety
export enum Platform {
  OTHER = "other",
  GITHUB = "github",
  TWITTER = "twitter",
  WEBSITE = "website",
  LINKEDIN = "linkedin",
  FACEBOOK = "facebook",
  INSTAGRAM = "instagram",
  PORTFOLIO = "portfolio",
}

export enum UserRole {
  SCHOLAR = "scholar",
  GUIDE = "guide",
  PARTNER = "partner",
  ADMIN = "admin",
}

// Interface for digital link subdocument
export interface IDigitalLink {
  platform: Platform;
  url: string;
}

// Interface for the user document
export interface IUser extends Document {
  email: string;
  isVerified: boolean;
  lastLogin?: Date;
  wallet_address?: string;
  roles: UserRole[];
  companyAffiliation?: string;
  interests: string[];
  personalValues: string[];
  digitalLinks: IDigitalLink[];
  companyName?: string;
  details?: string;
  newsletter: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Digital link subdocument schema
const digitalLinkSchema = new Schema<IDigitalLink>(
  {
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
        validator: function (url: string) {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        },
        message: "Please provide a valid URL",
      },
    },
  },
  { _id: false }
);

// User schema definition
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: "Please provide a valid email address",
      },
      unique: true,
    },

    isVerified: {
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
        validator: function (address: string) {
          if (!address) return true; // Optional field
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
        validator: function (roles: string[]) {
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
        validator: function (interests: string[]) {
          return interests.every(
            (interest: string) => interest.trim().length > 0
          );
        },
        message: "Interests cannot be empty strings",
      },
    },

    personalValues: {
      type: [String],
      default: [],
      validate: {
        validator: function (values: string[]) {
          return values.every((value: string) => value.trim().length > 0);
        },
        message: "Personal values cannot be empty strings",
      },
    },

    digitalLinks: {
      type: [digitalLinkSchema],
      default: [],
      validate: {
        validator: function (links: IDigitalLink[]) {
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
  },
  {
    timestamps: true,
    collection: "si3Users",
  }
);

// Essential indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ roles: 1 });
userSchema.index({ wallet_address: 1 }, { sparse: true });
userSchema.index({ isVerified: 1, createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// Essential pre-save middleware
userSchema.pre("save", function (next) {
  // Clean interests array
  if (this.interests && Array.isArray(this.interests)) {
    this.interests = this.interests
      .map((interest: string) => interest.trim())
      .filter((interest: string) => interest.length > 0);
  }

  // Clean personal values array
  if (this.personalValues && Array.isArray(this.personalValues)) {
    this.personalValues = this.personalValues
      .map((value: string) => value.trim())
      .filter((value: string) => value.length > 0);
  }

  // Auto-add https:// to digital links if missing
  if (this.digitalLinks && Array.isArray(this.digitalLinks)) {
    this.digitalLinks.forEach((link: IDigitalLink) => {
      if (link.url && !link.url.startsWith("http")) {
        link.url = `https://${link.url}`;
      }
    });
  }

  // Update lastLogin if user is being verified
  if (this.isModified("isVerified") && this.isVerified && !this.lastLogin) {
    this.lastLogin = new Date();
  }

  next();
});

// Error handling for duplicate email
userSchema.post("save", function (error: any, doc: any, next: any) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("A user with this email already exists"));
  } else {
    next(error);
  }
});

// Create and export model
const UserModel = mongoose.model<IUser>("SI3-User", userSchema);

export default UserModel;
