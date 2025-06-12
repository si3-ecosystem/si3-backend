import { ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";

import User from "../models/userModel.js";
import WalletNonce from "../models/walletModel.js";

import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";
import { createSendToken } from "../utils/authUtils.js";

/**
 * Request a sign message for wallet authentication
 */
export const requestSignMessage = catchAsync(async (req, res, next) => {
  const { wallet_address } = req.body;

  if (!wallet_address || !ethers.utils.isAddress(wallet_address)) {
    return next(new AppError("Valid wallet address is required", 400));
  }

  // Generate secure nonce
  const nonce = uuidv4();
  const normalizedAddress = wallet_address.toLowerCase();

  const message = `Sign this message to authenticate with SI<3>.\n\nWallet: ${normalizedAddress}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;

  // Store/update nonce in MongoDB
  await WalletNonce.findOneAndUpdate(
    { wallet_address: normalizedAddress },
    {
      nonce,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
    { upsert: true, new: true }
  );

  res.status(200).json({
    status: "success",
    message: "Sign message generated successfully",
    data: {
      message,
      wallet_address: normalizedAddress,
      expiresIn: "10 minutes",
    },
  });
});

/**
 * Verify signature and authenticate user
 */
export const verifySignature = catchAsync(async (req, res, next) => {
  const { wallet_address, signature } = req.body;

  if (!wallet_address || !signature) {
    return next(new AppError("Wallet address and signature are required", 400));
  }

  if (!ethers.utils.isAddress(wallet_address)) {
    return next(new AppError("Invalid wallet address format", 400));
  }

  const normalizedAddress = wallet_address.toLowerCase();

  // Get nonce from MongoDB
  const nonceDoc = await WalletNonce.findOne({
    wallet_address: normalizedAddress,
    expiresAt: { $gt: new Date() },
  });

  if (!nonceDoc) {
    return next(
      new AppError(
        "Nonce not found or expired. Please request a new sign message.",
        400
      )
    );
  }

  // Reconstruct the original message
  const expectedMessage = `Sign this message to authenticate with SI<3>.\n\nWallet: ${normalizedAddress}\nNonce: ${
    nonceDoc.nonce
  }\nTimestamp: ${Date.now()}`;

  try {
    // Verify signature
    const recoveredAddress = ethers.utils.verifyMessage(
      expectedMessage,
      signature
    );

    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      return next(
        new AppError("Signature verification failed - address mismatch", 401)
      );
    }

    // Delete used nonce (prevent replay attacks)
    await WalletNonce.deleteOne({ _id: nonceDoc._id });

    // Find user with this wallet address
    const user = await User.findOne({ wallet_address: normalizedAddress });

    if (!user) {
      return next(
        new AppError("No user account found with this wallet address", 404)
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create and send token
    createSendToken(user, 200, res, "Wallet authentication successful");
  } catch (error) {
    console.error("Signature verification error:", error);
    return next(
      new AppError("Invalid signature format or verification failed", 400)
    );
  }
});

/**
 * Link wallet to existing authenticated user account
 */
export const linkWallet = catchAsync(async (req, res, next) => {
  const { wallet_address, signature } = req.body;
  const user = req.user; // From protect middleware

  if (!wallet_address || !signature) {
    return next(new AppError("Wallet address and signature are required", 400));
  }

  if (!ethers.utils.isAddress(wallet_address)) {
    return next(new AppError("Invalid wallet address format", 400));
  }

  const normalizedAddress = wallet_address.toLowerCase();

  // Check if wallet is already linked to another user
  const existingUser = await User.findOne({
    wallet_address: normalizedAddress,
    _id: { $ne: user._id },
  });

  if (existingUser) {
    return next(
      new AppError("This wallet is already linked to another account", 400)
    );
  }

  // Check if current user already has a wallet
  if (user.wallet_address && user.wallet_address !== normalizedAddress) {
    return next(
      new AppError(
        "You already have a wallet linked. Please unlink first.",
        400
      )
    );
  }

  // Verify signature (same process as login)
  const nonceDoc = await WalletNonce.findOne({
    wallet_address: normalizedAddress,
    expiresAt: { $gt: new Date() },
  });

  if (!nonceDoc) {
    return next(
      new AppError(
        "Nonce not found or expired. Please request a new sign message.",
        400
      )
    );
  }

  const expectedMessage = `Sign this message to authenticate with SI<3>.\n\nWallet: ${normalizedAddress}\nNonce: ${
    nonceDoc.nonce
  }\nTimestamp: ${Date.now()}`;

  try {
    const recoveredAddress = ethers.utils.verifyMessage(
      expectedMessage,
      signature
    );

    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      return next(new AppError("Signature verification failed", 401));
    }

    // Delete used nonce
    await WalletNonce.deleteOne({ _id: nonceDoc._id });

    // Link wallet to user
    user.wallet_address = normalizedAddress;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Wallet linked successfully to your account",
      data: {
        user: {
          id: user._id,
          email: user.email,
          wallet_address: user.wallet_address,
          roles: user.roles,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    console.error("Signature verification error:", error);
    return next(new AppError("Invalid signature format", 400));
  }
});

/**
 * Unlink wallet from authenticated user account
 */
export const unlinkWallet = catchAsync(async (req, res, next) => {
  const user = req.user; // From protect middleware

  if (!user.wallet_address) {
    return next(
      new AppError("No wallet is currently linked to your account", 400)
    );
  }

  // Remove wallet address
  user.wallet_address = undefined;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Wallet unlinked successfully from your account",
    data: {
      user: {
        id: user._id,
        email: user.email,
        wallet_address: user.wallet_address,
        roles: user.roles,
      },
    },
  });
});
