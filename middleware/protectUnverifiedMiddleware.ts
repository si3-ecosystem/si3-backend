import { Request, Response, NextFunction } from "express";

import UserModel, { IUser } from "../models/usersModel";

import AppError from "../utils/AppError";
import authUtils from "../utils/authUtils";
import catchAsync from "../utils/catchAsync";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Protect middleware that allows unverified users
 * Used for verification endpoints where unverified users need access
 */
export const protectUnverified = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Debug logging
    console.log('[protectUnverified] Headers:', {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie,
      'user-agent': req.headers['user-agent']
    });
    console.log('[protectUnverified] Cookies:', req.cookies);

    // 1) Getting token and check if it's there
    let token: string | null = null;

    // Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      console.log('[protectUnverified] Token from Authorization header:', token ? 'Found' : 'Not found');
    }

    // Check cookies
    if (!token && req.cookies) {
      token = authUtils.extractToken(req.headers.authorization, req.cookies);
      console.log('[protectUnverified] Token from cookies:', token ? 'Found' : 'Not found');
    }

    console.log('[protectUnverified] Final token status:', token ? 'Token available' : 'No token found');

    if (!token) {
      console.log('[protectUnverified] No token found, returning 401');
      return next(
        AppError.unauthorized(
          "You are not logged in! Please log in to get access."
        )
      );
    }

    // 2) Verification token
    let decoded;
    try {
      console.log('[protectUnverified] Attempting to verify token...');
      decoded = authUtils.verifyToken(token);
      console.log('[protectUnverified] Token verified successfully for user:', decoded._id);
    } catch (error) {
      console.log('[protectUnverified] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
      return next(AppError.unauthorized("Invalid token. Please log in again!"));
    }

    // 3) Check if user still exists
    const currentUser = await UserModel.findById(decoded._id);
    if (!currentUser) {
      return next(
        AppError.unauthorized(
          "The user belonging to this token no longer exists."
        )
      );
    }

    // 4) Skip verification check - this is the key difference from protect middleware
    // Allow unverified users to access verification endpoints

    // 5) Update last login timestamp
    currentUser.lastLogin = new Date();
    await currentUser.save({ validateBeforeSave: false });

    // Grant access to protected route
    req.user = currentUser;
    next();
  }
);

export default protectUnverified;
