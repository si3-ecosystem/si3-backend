import mongoose from "mongoose";

const partnerProgramSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    companyName: {
      type: String,
      required: true,
    },

    interests: {
      type: [String],

      required: true,
    },

    details: {
      type: String,
    },

    newsletter: {
      type: Boolean,
      required: true,
    },
  },

  { timestamps: true }
);

const PartnerProgramModel = mongoose.model(
  "PartnerProgram",
  partnerProgramSchema
);

export default PartnerProgramModel;
