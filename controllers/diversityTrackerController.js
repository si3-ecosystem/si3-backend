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

export const getDiversityTrackerSummary = async (req, res, next) => {
  try {
    const allEntries = await DiversityTrackerModel.find();
    const totalResponses = allEntries.length;

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

    const selfIdentity = getPercentages(selfIdentityOptions, "selfIdentity");
    const ageRange = getPercentages(ageRangeOptions, "ageRange");
    const sexualOrientation = getPercentages(
      sexualOrientationOptions,
      "sexualOrientation"
    );

    const equityScores = allEntries
      .map((e) => e.equityScale)
      .filter((v) => typeof v === "number");
    const inclusivityScore =
      equityScores.length > 0
        ? (
            equityScores.reduce((a, b) => a + b, 0) / equityScores.length
          ).toFixed(2)
        : "0.00";

    const averageRating = inclusivityScore;

    res.status(200).json({
      totalResponses,
      selfIdentity,
      ageRange,
      sexualOrientation,
      inclusivityScore,
      averageRating,
      message: totalResponses === 0 ? "No data found" : undefined,
    });
  } catch (err) {
    next(err);
  }
};
