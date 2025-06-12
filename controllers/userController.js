// controllers/userController.js
import User from "../models/userModel.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

// Get user profile
export const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("-__v");

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Update user profile
export const updateProfile = catchAsync(async (req, res, next) => {
  const {
    wallet_address,
    roles,
    companyAffiliation,
    interests,
    personalValues,
    digitalLinks,
    companyName,
    details,
    newsletter,
  } = req.body;

  // Validate roles if provided
  if (roles && roles.length > 0) {
    const validRoles = ["scholar", "guide", "partner"];
    const invalidRoles = roles.filter((role) => !validRoles.includes(role));

    if (invalidRoles.length > 0) {
      return next(
        new AppError(`Invalid roles: ${invalidRoles.join(", ")}`, 400)
      );
    }
  }

  // Validate digital links if provided
  if (digitalLinks && digitalLinks.length > 0) {
    const validPlatforms = [
      "linkedin",
      "twitter",
      "github",
      "instagram",
      "facebook",
      "website",
      "portfolio",
      "other",
    ];

    for (const link of digitalLinks) {
      if (!validPlatforms.includes(link.platform)) {
        return next(new AppError(`Invalid platform: ${link.platform}`, 400));
      }

      // Basic URL validation
      try {
        new URL(link.url);
      } catch {
        return next(
          new AppError(`Invalid URL for ${link.platform}: ${link.url}`, 400)
        );
      }
    }
  }

  // Build update object
  const updateData = {};

  if (wallet_address !== undefined) updateData.wallet_address = wallet_address;
  if (roles && roles.length > 0) updateData.roles = roles;
  if (companyAffiliation !== undefined)
    updateData.companyAffiliation = companyAffiliation;
  if (interests) updateData.interests = interests;
  if (personalValues) updateData.personalValues = personalValues;
  if (digitalLinks) updateData.digitalLinks = digitalLinks;
  if (companyName !== undefined) updateData.companyName = companyName;
  if (details !== undefined) updateData.details = details;
  if (newsletter !== undefined) updateData.newsletter = newsletter;

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  }).select("-__v");

  res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: {
      user,
    },
  });
});

// Get all users (admin function)
export const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select("-__v");

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});
