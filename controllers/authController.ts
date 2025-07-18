import { ethers } from "ethers";
import { Request, Response, NextFunction } from "express";

import UserModel, { IUser, UserRole } from "../models/usersModel";

import emailService from "../config/protonMail";

import redisHelper from "../helpers/redisHelper";

import AppError from "../utils/AppError";
import authUtils from "../utils/authUtils";
import catchAsync from "../utils/catchAsync";
import {
  otpEmailTemplate,
  welcomeEmailTemplate,
  loginAlertEmailTemplate,
} from "../utils/emailTemplates";

// Constants for Redis keys and TTL
const OTP_KEY_PREFIX = "auth:otp:";
const NONCE_KEY_PREFIX = "auth:nonce:";
const RATE_LIMIT_KEY_PREFIX = "auth:rate_limit:";

const OTP_TTL_SECONDS = parseInt(process.env.OTP_TTL_SECONDS || "600", 10); // 10 minutes
const NONCE_TTL_SECONDS = parseInt(process.env.NONCE_TTL_SECONDS || "600", 10); // 10 minutes
const RATE_LIMIT_SECONDS = parseInt(process.env.RATE_LIMIT_SECONDS || "60", 10); // 1 minute

/**
 * Send OTP to email for passwordless login
 */

export const sendEmailOTP = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email } = req.body;

    // Rate limiting
    const rateLimitKey = `${RATE_LIMIT_KEY_PREFIX}email:${email}`;
    const isLimited = await redisHelper.cacheGet(rateLimitKey);

    if (isLimited) {
      return next(
        AppError.tooManyRequests("Please wait before requesting another OTP")
      );
    }

    // Generate OTP
    const otp = authUtils.generateOTP(6);

    // Store OTP in Redis
    const otpKey = `${OTP_KEY_PREFIX}${email}`;
    await redisHelper.cacheSet(otpKey, otp, OTP_TTL_SECONDS);

    // Set rate limit
    await redisHelper.cacheSet(rateLimitKey, "1", RATE_LIMIT_SECONDS);

    const applicantConfirmationHtml = otpEmailTemplate(otp, email);

    // In production, integrate with your email service:
    await emailService.sendEmail({
      senderName: "SI<3> Guides",
      senderEmail: emailService.getSenderEmail("basic"),
      toName: email,
      toEmail: email,
      subject: "OTP for SI<3> login",
      htmlContent: applicantConfirmationHtml,
      emailType: "basic",
    });

    res.status(200).json({
      status: "success",
      message: "OTP sent to your email address",
      data: {
        email,
        expiresIn: OTP_TTL_SECONDS,
      },
    });
  }
);

/**
 * Verify OTP and login/register user
 */

export const verifyEmailOTP = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, otp } = req.body;

    // Get OTP from Redis
    const otpKey = `${OTP_KEY_PREFIX}${email}`;
    const storedOTP = await redisHelper.cacheGet(otpKey);

    if (!storedOTP) {
      return next(AppError.badRequest("OTP has expired or is invalid"));
    }

    if (Number(storedOTP) !== Number(otp)) {
      return next(AppError.badRequest("Invalid OTP"));
    }

    // Clear OTP from Redis
    await redisHelper.cacheDelete(otpKey);

    // Find or create user
    let user = await UserModel.findOne({ email });
    let isNewUser = false;

    const loginTime = new Date().toISOString();
    const ip = req.headers["x-forwarded-for"] || "Unknown";

    if (!user) {
      user = new UserModel({
        email,
        isVerified: true,
        lastLogin: new Date(),
        roles: [UserRole.SCHOLAR],
      });

      await user.save();
      isNewUser = true;

      // Send welcome email
      const welcomeHtml = welcomeEmailTemplate();

      await emailService.sendEmail({
        senderName: "SI U Team",
        senderEmail: emailService.getSenderEmail("basic"),
        toName: email,
        toEmail: email,
        subject: "Welcome to SI U",
        htmlContent: welcomeHtml,
        emailType: "basic",
      });
    } else {
      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      // Send login alert
      const loginHtml = loginAlertEmailTemplate({
        email,
        time: loginTime,
        location: "Unknown",
        ipAddress: Array.isArray(ip) ? ip[0] : ip,
      });

      await emailService.sendEmail({
        senderName: "SI U Security",
        senderEmail: emailService.getSenderEmail("basic"),
        toName: email,
        toEmail: email,
        subject: "New Login Detected",
        htmlContent: loginHtml,
        emailType: "basic",
      });
    }

    // Finally generate and send token
    authUtils.createSendToken(
      user,
      200,
      res,
      isNewUser ? "Account created successfully" : "Login successful"
    );
  }
);

/**
 * Request wallet signature message
 */

export const requestWalletSignature = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { wallet_address } = req.body;

    // Rate limiting
    const rateLimitKey = `${RATE_LIMIT_KEY_PREFIX}wallet:${wallet_address}`;
    const isLimited = await redisHelper.cacheGet(rateLimitKey);

    if (isLimited) {
      return next(
        AppError.tooManyRequests(
          "Please wait before requesting another signature"
        )
      );
    }

    // Generate nonce
    const nonce = authUtils.generateNonce();
    const message = `Sign this message to authenticate with SI U\n\nNonce: ${nonce}`;

    // Store nonce in Redis
    const nonceKey = `${NONCE_KEY_PREFIX}${wallet_address}`;
    await redisHelper.cacheSet(nonceKey, nonce, NONCE_TTL_SECONDS);

    // Set rate limit
    await redisHelper.cacheSet(rateLimitKey, "1", RATE_LIMIT_SECONDS);

    res.status(200).json({
      status: "success",
      data: {
        message,
        wallet_address,
        expiresIn: NONCE_TTL_SECONDS,
      },
    });
  }
);

/**
 * Verify wallet signature and login/register user
 */

export const verifyWalletSignature = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { wallet_address, signature } = req.body;

    // Get nonce from Redis
    const nonceKey = `${NONCE_KEY_PREFIX}${wallet_address}`;
    const storedNonce = await redisHelper.cacheGet(nonceKey);

    if (!storedNonce) {
      return next(AppError.badRequest("Nonce has expired or is invalid"));
    }

    // Verify signature
    const expectedMessage = `Sign this message to authenticate with SI U\n\nNonce: ${storedNonce}`;
    let recoveredAddress: string;

    try {
      recoveredAddress = ethers.utils.verifyMessage(expectedMessage, signature); // ethers v5 syntax
    } catch (error) {
      return next(AppError.badRequest("Invalid signature format"));
    }

    if (recoveredAddress.toLowerCase() !== wallet_address.toLowerCase()) {
      return next(AppError.unauthorized("Signature verification failed"));
    }

    // Clear nonce from Redis
    await redisHelper.cacheDelete(nonceKey);

    // Find or create user
    let user = await UserModel.findOne({
      wallet_address: wallet_address.toLowerCase(),
    });
    let isNewUser = false;

    if (!user) {
      // Create new user with temporary email
      const tempEmail = `${wallet_address.toLowerCase()}@wallet.temp`;
      user = new UserModel({
        email: tempEmail,
        wallet_address: wallet_address.toLowerCase(),
        isVerified: true,
        roles: [UserRole.SCHOLAR], // Default role
        lastLogin: new Date(),
      });
      await user.save();
      isNewUser = true;
    } else {
      // Update existing user
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    }

    // Generate and send token
    authUtils.createSendToken(
      user,
      200,
      res,
      isNewUser ? "Account created successfully" : "Login successful"
    );
  }
);

/**
 * Connect wallet to existing user account
 */

export const connectWallet = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { wallet_address, signature } = req.body;
    const user = req.user as IUser;

    // Get nonce from Redis
    const nonceKey = `${NONCE_KEY_PREFIX}${wallet_address}`;
    const storedNonce = await redisHelper.cacheGet(nonceKey);

    if (!storedNonce) {
      return next(AppError.badRequest("Nonce has expired or is invalid"));
    }

    // Verify signature
    const expectedMessage = `Sign this message to authenticate with SI U\n\nNonce: ${storedNonce}`;
    let recoveredAddress: string;

    try {
      recoveredAddress = ethers.utils.verifyMessage(expectedMessage, signature); // ethers v5 syntax
    } catch (error) {
      return next(AppError.badRequest("Invalid signature format"));
    }

    if (recoveredAddress.toLowerCase() !== wallet_address.toLowerCase()) {
      return next(AppError.unauthorized("Signature verification failed"));
    }

    // Check if wallet is already connected to another user
    const existingUser = await UserModel.findOne({
      wallet_address: wallet_address.toLowerCase(),
      _id: { $ne: user._id },
    });

    if (existingUser) {
      return next(
        AppError.conflict(
          "Wallet address is already connected to another account"
        )
      );
    }

    // Connect wallet to user
    user.wallet_address = wallet_address.toLowerCase();
    await user.save();

    // Clear nonce from Redis
    await redisHelper.cacheDelete(nonceKey);

    // Generate new token with updated user data
    authUtils.createSendToken(user, 200, res, "Wallet connected successfully");
  }
);

/**
 * Disconnect wallet from user account
 */

export const disconnectWallet = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user as IUser;

    if (!user.wallet_address) {
      return next(AppError.badRequest("No wallet connected to disconnect"));
    }

    // Remove wallet from user
    user.wallet_address = undefined;
    await user.save();

    // Generate new token with updated user data
    authUtils.createSendToken(
      user,
      200,
      res,
      "Wallet disconnected successfully"
    );
  }
);

/**
 * Logout user
 */

export const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Clear authentication cookie
    authUtils.clearAuthCookie(res);

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  }
);

/**
 * Get current user profile
 */

export const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user as IUser;

    const userResponse = {
      id: user._id,
      email: user.email,
      roles: user.roles,
      isVerified: user.isVerified,
      companyName: user.companyName,
      companyAffiliation: user.companyAffiliation,
      interests: user.interests,
      personalValues: user.personalValues,
      digitalLinks: user.digitalLinks,
      details: user.details,
      newsletter: user.newsletter,
      wallet_address: user.wallet_address,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      status: "success",
      data: {
        user: userResponse,
      },
    });
  }
);

/**
 * Update user profile
 */

export const updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user as IUser;
    const allowedFields = [
      "companyName",
      "companyAffiliation",
      "interests",
      "personalValues",
      "digitalLinks",
      "details",
      "newsletter",
      "roles",
    ];

    // Filter out fields that are not allowed to be updated
    const updateData: any = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Only allow admins to update roles
    if (updateData.roles && !user.roles.includes(UserRole.ADMIN)) {
      delete updateData.roles;
    }

    // Update user
    Object.assign(user, updateData);
    await user.save();

    // Generate new token with updated user data
    authUtils.createSendToken(user, 200, res, "Profile updated successfully");
  }
);

/**
 * Refresh authentication token
 */

export const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user as IUser;

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate new token
    authUtils.createSendToken(user, 200, res, "Token refreshed successfully");
  }
);

/**
 * Check authentication status
 */

export const checkAuth = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = authUtils.extractToken(
      req.headers.authorization as string,
      req.cookies
    );

    if (!token) {
      res.status(200).json({
        status: "success",
        data: {
          isAuthenticated: false,
        },
      });

      return;
    }

    try {
      const decoded = authUtils.verifyToken(token);
      const user = await UserModel.findById(decoded._id);

      if (!user || !user.isVerified) {
        res.status(200).json({
          status: "success",
          data: {
            isAuthenticated: false,
          },
        });

        return;
      }

      res.status(200).json({
        status: "success",
        data: {
          isAuthenticated: true,
          user: {
            id: user._id,
            email: user.email,
            roles: user.roles,
            isVerified: user.isVerified,
          },
        },
      });
    } catch (error) {
      res.status(200).json({
        status: "success",
        data: {
          isAuthenticated: false,
        },
      });
    }
  }
);
