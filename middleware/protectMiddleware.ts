import { Request, Response, NextFunction } from "express";

import AppError from "../utils/AppError";
import authUtils from "../utils/authUtils";

import UserModel, { IUser, UserRole } from "../models/usersModel";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Middleware to protect routes requiring authentication
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1) Get token from cookies or headers
    const token = authUtils.extractToken(
      req.headers.authorization as string,
      req.cookies
    );

    if (!token) {
      return next(
        AppError.unauthorized(
          "You are not logged in. Please log in to get access."
        )
      );
    }

    // 2) Verify token
    let decoded;
    try {
      decoded = authUtils.verifyToken(token);
    } catch (error) {
      return next(error);
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

    // 4) Check if user is verified (optional - depends on your business logic)
    if (!currentUser.isVerified) {
      return next(
        AppError.unauthorized(
          "Your account is not verified. Please verify your email."
        )
      );
    }

    // 5) Update last login timestamp
    currentUser.lastLogin = new Date();
    await currentUser.save({ validateBeforeSave: false });

    // 6) Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is authenticated (but not require it)
 * Useful for routes that work both for authenticated and non-authenticated users
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = authUtils.extractToken(
      req.headers.authorization as string,
      req.cookies
    );

    if (!token) {
      return next();
    }

    try {
      const decoded = authUtils.verifyToken(token);
      const currentUser = await UserModel.findById(decoded._id);

      if (currentUser && currentUser.isVerified) {
        req.user = currentUser;
      }
    } catch (error) {
      // If token is invalid, just continue without user
      console.warn(
        "Invalid token in authenticate middleware:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Middleware to restrict access to certain roles
 */
export const restrictTo = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        AppError.unauthorized("You must be logged in to access this resource.")
      );
    }

    // Check if user has at least one of the required roles
    const hasRequiredRole = req.user.roles.some((role) =>
      roles.includes(role as UserRole)
    );

    if (!hasRequiredRole) {
      return next(
        AppError.forbidden("You do not have permission to perform this action.")
      );
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = restrictTo(UserRole.ADMIN);

/**
 * Middleware to check if user is guide
 */
export const requireGuide = restrictTo(UserRole.GUIDE, UserRole.ADMIN);

/**
 * Middleware to check if user is scholar
 */
export const requireScholar = restrictTo(UserRole.SCHOLAR, UserRole.ADMIN);

/**
 * Middleware to check if user is partner
 */
export const requirePartner = restrictTo(UserRole.PARTNER, UserRole.ADMIN);

/**
 * Middleware to check if user owns the resource or is admin
 */
export const requireOwnershipOrAdmin = (userIdField: string = "userId") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        AppError.unauthorized("You must be logged in to access this resource.")
      );
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    const currentUserId = (req.user._id as any).toString();
    const isAdmin = req.user.roles.includes(UserRole.ADMIN);

    if (resourceUserId !== currentUserId && !isAdmin) {
      return next(
        AppError.forbidden("You can only access your own resources.")
      );
    }

    next();
  };
};

/**
 * Middleware to check if user has verified email
 */
export const requireVerifiedEmail = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(
      AppError.unauthorized("You must be logged in to access this resource.")
    );
  }

  if (!req.user.isVerified) {
    return next(
      AppError.forbidden(
        "You must verify your email address to access this resource."
      )
    );
  }

  next();
};

/**
 * Middleware to check if user has connected wallet
 */
export const requireWallet = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(
      AppError.unauthorized("You must be logged in to access this resource.")
    );
  }

  if (!req.user.wallet_address) {
    return next(
      AppError.badRequest("You must connect a wallet to access this resource.")
    );
  }

  next();
};
