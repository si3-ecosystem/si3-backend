import { Response } from "express";

import { IUser } from "../models/usersModel";
import encryptionService from "./encryption";

interface TokenPayload extends Omit<IUser, "_id"> {
  _id: string;
  iat?: number;
  exp?: number;
}

interface CookieOptions {
  httpOnly: boolean;
  sameSite: "strict" | "lax" | "none";
  secure: boolean;
  maxAge: number;
  path: string;
  domain?: string;
}

class AuthUtils {
  private readonly cookieName: string = "si3-jwt";

  /**
   * Generate JWT token
   */
  generateToken(user: IUser): string {
    // Convert the user document to a plain object and handle _id
    const userPayload = {
      ...user.toObject(),
      _id: user._id.toString(), // Ensure _id is a string
    };

    return encryptionService.generateToken(userPayload);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): TokenPayload {
    return encryptionService.verifyToken(token) as TokenPayload;
  }

  /**
   * Get cookie options based on environment
   */
  private getCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === "production";

    return {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
      domain: process.env.COOKIE_DOMAIN || "localhost",
    };
  }

  /**
   * Set authentication cookie
   */
  setAuthCookie(res: Response, token: string): void {
    const cookieOptions = this.getCookieOptions();
    res.cookie(this.cookieName, token, cookieOptions);
  }

  /**
   * Clear authentication cookie
   */
  clearAuthCookie(res: Response): void {
    res.clearCookie(this.cookieName, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      domain: process.env.COOKIE_DOMAIN || "localhost",
    });
  }

  /**
   * Create and send token response
   */
  createSendToken(
    user: IUser,
    statusCode: number,
    res: Response,
    message: string = "Authentication successful"
  ): void {
    const token = this.generateToken(user);

    // Set HTTP-only cookie
    this.setAuthCookie(res, token);

    // Remove sensitive data from response
    const userResponse = {
      id: user._id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      interests: user.interests,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      isVerified: user.isVerified,
      newsletter: user.newsletter,
      companyName: user.companyName,
      digitalLinks: user.digitalLinks,
      wallet_address: user.wallet_address,
      personalValues: user.personalValues,
      companyAffiliation: user.companyAffiliation,
      // New fields for settings page
      notificationSettings: user.notificationSettings,
      walletInfo: user.walletInfo,
      settingsUpdatedAt: user.settingsUpdatedAt,
    };

    res.status(statusCode).json({
      status: "success",
      message,
      data: {
        token,
        user: userResponse,
      },
    });
  }

  /**
   * Extract token from request
   */
  extractToken(authHeader?: string, cookies?: any): string | null {
    // Try to get from cookies first (preferred method)
    if (cookies && cookies[this.cookieName]) {
      return cookies[this.cookieName];
    }

    // Fallback to Authorization header
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Generate OTP
   */
  generateOTP(length: number = 6): string {
    return encryptionService.generateOTP(length);
  }

  /**
   * Generate nonce for wallet authentication
   */
  generateNonce(): string {
    return encryptionService.generateRandomString(16);
  }

  /**
   * Get expiration time in seconds
   */
  getTokenExpirationSeconds(): number {
    const expiration = process.env.JWT_EXPIRES_IN || "30d";

    // Parse time string (e.g., "7d", "24h", "60m")
    const timeValue = parseInt(expiration.slice(0, -1));
    const timeUnit = expiration.slice(-1);

    switch (timeUnit) {
      case "d":
        return timeValue * 24 * 60 * 60;
      case "h":
        return timeValue * 60 * 60;
      case "m":
        return timeValue * 60;
      case "s":
        return timeValue;
      default:
        return 7 * 24 * 60 * 60;
    }
  }
}

const authUtils = new AuthUtils();
export default authUtils;
