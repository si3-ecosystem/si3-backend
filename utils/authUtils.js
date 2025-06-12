import crypto from "crypto";
import jwt from "jsonwebtoken";

// Generate secure OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Create JWT Token
export const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      roles: user.roles,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      wallet_address: user.wallet_address,
      companyName: user.companyName,
      newsletter: user.newsletter,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "30d",
    }
  );
};

// Verify JWT token
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Create and send JWT token via cookie
export const createSendToken = (
  user,
  statusCode = 200,
  res,
  message = "Success"
) => {
  const token = signToken(user);

  res.cookie("si3-jwt", token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
    domain: process.env.NODE_ENV === "production" ? "si3.space" : "localhost",
  });

  // Clean response data
  const userResponse = {
    id: user._id,
    email: user.email,
    roles: user.roles,
    isVerified: user.isVerified,
    lastLogin: user.lastLogin,
    wallet_address: user.wallet_address,
    companyName: user.companyName,
    newsletter: user.newsletter,
  };

  res.status(statusCode).json({
    status: "success",
    message,
    token,
    data: {
      user: userResponse,
    },
  });
};
