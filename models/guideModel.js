import mongoose from "mongoose";

const GuideSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, required: true },
    pronouns: { type: String, trim: true, required: true },
    interests: { type: [String], trim: true, required: true },
    personalValues: { type: String, trim: true, required: true },
    digitalLink: { type: String, trim: true, required: true },
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
