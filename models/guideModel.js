import mongoose from "mongoose";

const GuideSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, required: true },
    companyAffiliation: { type: String, trim: true, required: true },
    interests: { type: [String], trim: true, required: true },
    personalValues: { type: String, trim: true, default: "" },
    digitalLink: { type: String, enum: ["yes", "no"], default: "no" },
  },
  { timestamps: true }
);

GuideSchema.index({ createdAt: -1 });

GuideSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Guide = mongoose.models.Guide || mongoose.model("Guide", GuideSchema);
export default Guide;
