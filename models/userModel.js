import mongoose from "mongoose";

const digitalLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      enum: [
        "other",
        "github",
        "twitter",
        "website",
        "linkedin",
        "facebook",
        "instagram",
        "portfolio",
      ],
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    lastLogin: Date,

    wallet_address: {
      type: String,
      trim: true,
    },

    roles: [
      {
        type: String,
        enum: ["scholar", "guide", "partner", "admin"],
        required: true,
      },
    ],

    companyAffiliation: {
      type: String,
      trim: true,
    },

    interests: [
      {
        type: String,
        trim: true,
      },
    ],

    personalValues: [
      {
        type: String,
        trim: true,
      },
    ],

    digitalLinks: [digitalLinkSchema],

    companyName: {
      type: String,
      trim: true,
    },

    details: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    newsletter: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ roles: 1 });
userSchema.index({ wallet_address: 1 }, { sparse: true });

export default mongoose.model("SI3-User", userSchema);
