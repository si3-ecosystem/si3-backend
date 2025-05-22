import DiversityTrackerModel from "../models/diversityTrackerModel.js";

export const sexualOrientationOptions = [
  "Heterosexual/Straight",
  "Gay or Lesbian",
  "Bisexual",
  "Pansexual",
  "Queer",
  "Other",
];

export const selfIdentityOptions = [
  "Women",
  "Men",
  "Non-Binary",
  "Prefer to self-describe",
];

export const ageRangeOptions = [
  "Under 18",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65 and older",
];

// New options for the added fields
export const offeringClearOptions = ["Yes", "No", "Somewhat"];
export const decisionMakingOptions = ["Yes", "No", "Unsure"];
export const roadmapOptions = ["Yes", "No", "Unsure"];
export const financialsOptions = ["Yes", "No", "Unsure"];
export const grantProgramsOptions = ["Yes", "No"];
export const diversityInitiativesOptions = ["Yes", "No", "Unsure"];
export const diverseTeamOptions = ["Yes", "No", "Unsure"];
export const leadershipOptions = ["Yes", "No", "Unsure"];
export const highlightsOptions = ["Yes", "No", "Unsure"];

export const getDiversityTrackerSummary = async (req, res, next) => {
  try {
    const allEntries = await DiversityTrackerModel.find();
    const totalResponses = allEntries.length;

    // Helper function to calculate percentages for string fields
    const getPercentages = (options, field) => {
      if (totalResponses === 0) {
        return options.map((option) => ({ label: option, percent: 0 }));
      }
      const counts = options.map(
        (option) =>
          allEntries.filter(
            (entry) =>
              (entry[field] || "").trim().toLowerCase() === option.toLowerCase()
          ).length
      );
      return options.map((option, idx) => ({
        label: option,
        percent: Math.round((counts[idx] / totalResponses) * 100),
      }));
    };

    // Helper function to handle array fields
    const getArrayFieldStats = (field) => {
      if (totalResponses === 0) return [];
      
      // Collect all values from array fields across all entries
      const allValues = allEntries.reduce((acc, entry) => {
        if (Array.isArray(entry[field])) {
          entry[field].forEach(value => {
            acc.push(value);
          });
        }
        return acc;
      }, []);
      
      // Count occurrences of each value
      const valueCounts = {};
      allValues.forEach(value => {
        valueCounts[value] = (valueCounts[value] || 0) + 1;
      });
      
      // Convert to percentage format
      return Object.entries(valueCounts).map(([label, count]) => ({
        label,
        percent: Math.round((count / totalResponses) * 100),
      })).sort((a, b) => b.percent - a.percent); // Sort by percentage descending
    };

    // Original fields
    const selfIdentity = getPercentages(selfIdentityOptions, "selfIdentity");
    const ageRange = getPercentages(ageRangeOptions, "ageRange");
    const sexualOrientation = getPercentages(
      sexualOrientationOptions,
      "sexualOrientation"
    );

    // New fields - Accessibility
    const offeringClear = getPercentages(offeringClearOptions, "offeringClear");
    const engagementChannels = getArrayFieldStats("engagementChannels");

    // New fields - Transparency
    const decentralizedDecisionMaking = getPercentages(decisionMakingOptions, "decentralizedDecisionMaking");
    const hasRoadmap = getPercentages(roadmapOptions, "hasRoadmap");
    const reportsFinancials = getPercentages(financialsOptions, "reportsFinancials");
    const runsGrantPrograms = getPercentages(grantProgramsOptions, "runsGrantPrograms");

    // New fields - Inclusivity
    const diversityInitiatives = getPercentages(diversityInitiativesOptions, "diversityInitiatives");
    const diverseTeam = getPercentages(diverseTeamOptions, "diverseTeam");
    const underrepresentedLeadership = getPercentages(leadershipOptions, "underrepresentedLeadership");
    const highlightsUnderrepresented = getPercentages(highlightsOptions, "highlightsUnderrepresented");

    // Calculate ethnicity and disability stats (array fields)
    const ethnicity = getArrayFieldStats("ethnicity");
    const disability = getArrayFieldStats("disability");

    // Calculate scores
    const equityScores = allEntries
      .map((e) => e.equityScale)
      .filter((v) => typeof v === "number");
    const inclusivityScore =
      equityScores.length > 0
        ? (
            equityScores.reduce((a, b) => a + b, 0) / equityScores.length
          ).toFixed(2)
        : "0.00";

    // Text analysis for qualitative fields
    const uniqueValueThemes = analyzeTextFields(allEntries, "uniqueValue");
    const marketImpactThemes = analyzeTextFields(allEntries, "marketImpact");
    const improvementSuggestionsThemes = analyzeTextFields(allEntries, "improvementSuggestions");
    const claritySuggestionsThemes = analyzeTextFields(allEntries, "claritySuggestions");

    res.status(200).json({
      totalResponses,
      // Personal Information
      selfIdentity,
      ageRange,
      ethnicity,
      disability,
      sexualOrientation,
      inclusivityScore,
      
      // Accessibility
      offeringClear,
      engagementChannels,
      claritySuggestionsThemes,
      
      // Transparency
      decentralizedDecisionMaking,
      hasRoadmap,
      reportsFinancials,
      runsGrantPrograms,
      
      // Inclusivity
      diversityInitiatives,
      diverseTeam,
      underrepresentedLeadership,
      highlightsUnderrepresented,
      
      // Impact
      uniqueValueThemes,
      marketImpactThemes,
      improvementSuggestionsThemes,
      
      message: totalResponses === 0 ? "No data found" : undefined,
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to analyze text fields and extract common themes
function analyzeTextFields(entries, field) {
  const allTexts = entries
    .map(entry => entry[field])
    .filter(text => text && text.trim().length > 0);
  
  if (allTexts.length === 0) return [];
  
  // For now, just return the count of non-empty responses
  // In a real implementation, you might use NLP to extract themes
  return [{
    label: `${allTexts.length} responses`,
    percent: Math.round((allTexts.length / entries.length) * 100)
  }];
}
