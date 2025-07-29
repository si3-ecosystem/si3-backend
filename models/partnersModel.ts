import mongoose, { Document, Schema } from "mongoose";

// Interface for the document
export interface IPartnerProgram extends Document {
  name: string;
  email: string;
  details?: string;
  companyName: string;
  newsletter: boolean;
  interests: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const partnerProgramSchema = new Schema<IPartnerProgram>(
  {
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
        validator: function (email: string) {
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
        validator: function (interests: string[]) {
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
  },
  {
    timestamps: true,
    collection: "partner",
  }
);

// Essential indexes
partnerProgramSchema.index({ createdAt: -1 });
partnerProgramSchema.index({ email: 1 }, { unique: true });
partnerProgramSchema.index({ companyName: 1 });

// Essential pre-save middleware
partnerProgramSchema.pre("save", function (next) {
  // Clean interests array
  if (this.interests && Array.isArray(this.interests)) {
    this.interests = this.interests
      .map((interest: string) => interest.trim())
      .filter((interest: string) => interest.length > 0);
  }

  next();
});

// Error handling for duplicate email
partnerProgramSchema.post("save", function (error: any, doc: any, next: any) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    const duplicateError = new Error(
      "A partner with this email already exists"
    );
    duplicateError.name = "ValidationError";
    (duplicateError as any).statusCode = 400;
    next(duplicateError);
  } else {
    next(error);
  }
});

// Create and export model
const PartnerProgramModel = mongoose.model<IPartnerProgram>(
  "Partner",
  partnerProgramSchema
);

export default PartnerProgramModel;
