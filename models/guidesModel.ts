import mongoose, { Document, Schema } from "mongoose";

// Interface for the document
export interface IGuide extends Document {
  name: string;
  email: string;
  daoInterests: string;
  interests: string[];
  personalValues: string;
  digitalLink: string;

  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const guideSchema = new Schema<IGuide>(
  {
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
        validator: function (email: string) {
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
        validator: function (interests: string[]) {
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

  {
    timestamps: true,
    collection: "guides",
  }
);

// Essential indexes only
guideSchema.index({ createdAt: -1 });
guideSchema.index({ email: 1 }, { unique: true });

// Essential pre-save middleware
guideSchema.pre("save", function (next) {
  // Clean interests array
  if (this.interests && Array.isArray(this.interests)) {
    this.interests = this.interests
      .map((interest: string) => interest.trim())
      .filter((interest: string) => interest.length > 0);
  }

  // Auto-add https:// if missing
  if (this.digitalLink && !this.digitalLink.startsWith("http")) {
    this.digitalLink = `https://${this.digitalLink}`;
  }

  next();
});

// Error handling for duplicate email
guideSchema.post("save", function (error: any, doc: any, next: any) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("A guide with this email already exists"));
  } else {
    next(error);
  }
});

// Create and export model
const GuideModel = mongoose.model<IGuide>("Guide", guideSchema);

export default GuideModel;
