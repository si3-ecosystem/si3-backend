import mongoose from "mongoose";

const scholarsProgramSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    interests: {
      type: [String],
      required: [true, "At least one interest is required"],
      validate: {
        validator: function (v) {
          return v.length > 0;
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
  { timestamps: true }
);

export default mongoose.model("ScholarsProgram", scholarsProgramSchema);
