import User from "../models/userModel.js";

import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";
import { verifyToken } from "../utils/authUtils.js";

export const protect = catchAsync(async (req, res, next) => {
  // Get token from cookie or header
  let token;

  if (req.cookies["si3-jwt"] && req.cookies["si3-jwt"] !== "loggedout") {
    token = req.cookies["si3-jwt"];
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError(
        "You are not logged in. Please log in to access this resource.",
        401
      )
    );
  }

  // Verify token
  let decoded;

  try {
    decoded = verifyToken(token);
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again.", 401));
    } else if (error.name === "TokenExpiredError") {
      return next(
        new AppError("Your token has expired. Please log in again.", 401)
      );
    }
    return next(
      new AppError("Token verification failed. Please log in again.", 401)
    );
  }

  // Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists.", 401)
    );
  }

  req.user = currentUser;
  next();
});

// ADD this role-based authorization middleware
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    const hasPermission = req.user.roles.some((role) => roles.includes(role));

    if (!hasPermission) {
      const allowedRoles = roles.join(", ");
      const userRoles = req.user.roles.join(", ");

      return next(
        new AppError(
          `Access denied. Required roles: [${allowedRoles}]. Your roles: [${userRoles}]`,
          403
        )
      );
    }
    next();
  };
};
