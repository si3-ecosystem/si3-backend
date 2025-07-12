import mongoose, { Document, Schema } from "mongoose";

// Interface for the document
export interface IScholarsProgram extends Document {
  name: string;
  email: string;
  details?: string;
  interests: string[];
  newsletter: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const scholarsProgramSchema = new Schema<IScholarsProgram>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot be more than 100 characters"],
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

    interests: {
      type: [String],
      required: [true, "At least one interest is required"],
      validate: {
        validator: function (interests: string[]) {
          return Array.isArray(interests) && interests.length > 0;
        },
        message: "At least one interest is required",
      },
    },

    details: {
      type: String,
      trim: true,
      maxlength: [1000, "Details cannot be more than 1000 characters"],
    },

    newsletter: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "scholars",
  }
);

// Essential indexes
scholarsProgramSchema.index({ createdAt: -1 });
scholarsProgramSchema.index({ email: 1 }, { unique: true });
scholarsProgramSchema.index({ interests: 1 });

// Essential pre-save middleware
scholarsProgramSchema.pre("save", function (next) {
  // Clean interests array
  if (this.interests && Array.isArray(this.interests)) {
    this.interests = this.interests
      .map((interest: string) => interest.trim())
      .filter((interest: string) => interest.length > 0);
  }

  next();
});

// Error handling for duplicate email
scholarsProgramSchema.post("save", function (error: any, doc: any, next: any) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    const duplicateError = new Error(
      "A scholar with this email already exists"
    );
    duplicateError.name = "ValidationError";
    (duplicateError as any).statusCode = 400;
    next(duplicateError);
  } else {
    next(error);
  }
});

// Create and export model
const ScholarsProgramModel = mongoose.model<IScholarsProgram>(
  "Scholar",
  scholarsProgramSchema
);

export default ScholarsProgramModel;
