import mongoose from "mongoose";

const diversityTrackerSchema = new mongoose.Schema(
  {
    selfIdentity: {
      type: String,
      required: true,
    },

    ageRange: {
      type: String,
      required: true,
    },

    ethnicity: {
      type: String,
      required: true,
    },

    disability: {
      type: String,
      required: true,
    },

    sexualOrientation: {
      type: String,
      required: true,
    },

    equityScale: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },

    improvementSuggestions: {
      type: String,
    },

    grantProvider: {
      type: String,
    },

    grantRound: {
      type: String,
    },

    suggestions: {
      type: String,
    },

    activeGrantsParticipated: {
      type: String,
    },
  },

  {
    timestamps: true,
  }
);

const DiversityTrackerModel = mongoose.model(
  "DiversityTracker",
  diversityTrackerSchema
);

export default DiversityTrackerModel;
