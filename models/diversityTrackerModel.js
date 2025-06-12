import mongoose from "mongoose";

const diversityTrackerSchema = new mongoose.Schema(
  {
    // Personal Information
    selfIdentity: {
      type: String,
      required: true,
    },
    selfIdentityCustom: {
      type: String,
    },
    ageRange: {
      type: String,
      required: true,
    },
    ethnicity: {
      type: [String],
      required: true,
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Ethnicity must have at least one value'
      }
    },
    disability: {
      type: [String],
      required: true,
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Disability must have at least one value'
      }
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

    // Existing optional fields
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
      default: "no",
    },

    // New Accessibility fields
    offeringClear: {
      type: String,
      enum: ["Yes", "No", "Somewhat"],
      required: true,
    },
    claritySuggestions: {
      type: String,
    },
    engagementChannels: {
      type: [String],
      required: true,
    },

    // New Transparency fields
    decentralizedDecisionMaking: {
      type: String,
      enum: ["Yes", "No", "Unsure"],
      required: true,
    },
    hasRoadmap: {
      type: String,
      enum: ["Yes", "No", "Unsure"],
      required: true,
    },
    reportsFinancials: {
      type: String,
      enum: ["Yes", "No", "Unsure"],
      required: true,
    },
    runsGrantPrograms: {
      type: String,
      enum: ["Yes", "No"],
      required: true,
    },
    grantRoundParticipation: {
      type: String,
    },
    grantExperience: {
      type: String,
    },

    // New Inclusivity fields
    diversityInitiatives: {
      type: String,
      enum: ["Yes", "No", "Unsure"],
      required: true,
    },
    diverseTeam: {
      type: String,
      enum: ["Yes", "No", "Unsure"],
      required: true,
    },
    underrepresentedLeadership: {
      type: String,
      enum: ["Yes", "No", "Unsure"],
      required: true,
    },
    highlightsUnderrepresented: {
      type: String,
      enum: ["Yes", "No", "Unsure"],
      required: true,
    },

    // New Impact fields
    uniqueValue: {
      type: String,
      required: true,
    },
    marketImpact: {
      type: String,
      required: true,
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
