import { Request, Response, NextFunction } from "express";

import UserModel, { IUser, IWalletInfo } from "../models/usersModel";

import AppError from "../utils/AppError";
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
 * @desc    Get user wallet information
 * @route   GET /api/user/wallet/info
 * @access  Private
 */
export const getWalletInfo = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user as IUser;

    const userWithWallet = await UserModel.findById(user._id).select('walletInfo wallet_address');
    
    if (!userWithWallet) {
      return next(new AppError("User not found", 404));
    }

    // Handle legacy wallet_address field
    let walletInfo = userWithWallet.walletInfo;
    
    if (!walletInfo && userWithWallet.wallet_address) {
      // Migrate legacy wallet_address to walletInfo
      walletInfo = {
        address: userWithWallet.wallet_address,
        network: "Mainnet",
        connectedAt: userWithWallet.createdAt,
      };

      // Update user with migrated wallet info
      await UserModel.findByIdAndUpdate(user._id, {
        walletInfo,
        settingsUpdatedAt: new Date(),
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        walletInfo: walletInfo || null,
        isConnected: !!walletInfo?.address,
      },
    });
  }
);

/**
 * @desc    Connect wallet to user account
 * @route   POST /api/user/wallet/connect
 * @access  Private
 */
export const connectWallet = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user as IUser;
    const { address, connectedWallet, network } = req.body;

    // Validate Ethereum address format
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return next(new AppError("Please provide a valid Ethereum address", 400));
    }

    // Validate wallet type
    const validWallets = ["Zerion", "MetaMask", "WalletConnect", "Other"];
    if (connectedWallet && !validWallets.includes(connectedWallet)) {
      return next(new AppError("Invalid wallet type", 400));
    }

    // Validate network
    const validNetworks = ["Mainnet", "Polygon", "Arbitrum", "Base", "Optimism"];
    if (network && !validNetworks.includes(network)) {
      return next(new AppError("Invalid network", 400));
    }

    // Check if wallet address is already connected to another user
    const existingUser = await UserModel.findOne({
      $or: [
        { "walletInfo.address": address },
        { wallet_address: address }
      ],
      _id: { $ne: user._id }
    });

    if (existingUser) {
      return next(new AppError("This wallet address is already connected to another account", 400));
    }

    const walletInfo: IWalletInfo = {
      address: address.toLowerCase(),
      connectedWallet: connectedWallet || "Other",
      network: network || "Mainnet",
      connectedAt: new Date(),
      lastUsed: new Date(),
    };

    // Update user with wallet information
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        walletInfo,
        wallet_address: address.toLowerCase(), // Keep legacy field for compatibility
        settingsUpdatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select('walletInfo settingsUpdatedAt');

    if (!updatedUser) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Wallet connected successfully",
      data: {
        walletInfo: updatedUser.walletInfo,
        updatedAt: updatedUser.settingsUpdatedAt,
      },
    });
  }
);

/**
 * @desc    Disconnect wallet from user account
 * @route   DELETE /api/user/wallet/disconnect
 * @access  Private
 */
export const disconnectWallet = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user as IUser;

    // Update user to remove wallet information
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        $unset: {
          walletInfo: "",
          wallet_address: "", // Remove legacy field too
        },
        settingsUpdatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select('settingsUpdatedAt');

    if (!updatedUser) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Wallet disconnected successfully",
      data: {
        updatedAt: updatedUser.settingsUpdatedAt,
      },
    });
  }
);

/**
 * @desc    Update wallet last used timestamp
 * @route   PATCH /api/user/wallet/activity
 * @access  Private
 */
export const updateWalletActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user as IUser;

    const userWithWallet = await UserModel.findById(user._id).select('walletInfo');
    
    if (!userWithWallet || !userWithWallet.walletInfo?.address) {
      return next(new AppError("No wallet connected to this account", 400));
    }

    // Update last used timestamp
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        "walletInfo.lastUsed": new Date(),
        settingsUpdatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select('walletInfo settingsUpdatedAt');

    if (!updatedUser) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Wallet activity updated",
      data: {
        walletInfo: updatedUser.walletInfo,
        updatedAt: updatedUser.settingsUpdatedAt,
      },
    });
  }
);

/**
 * @desc    Get wallet connection history
 * @route   GET /api/user/wallet/history
 * @access  Private
 */
export const getWalletHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user as IUser;

    const userWithWallet = await UserModel.findById(user._id).select('walletInfo wallet_address createdAt');
    
    if (!userWithWallet) {
      return next(new AppError("User not found", 404));
    }

    const history = [];

    // Current wallet info
    if (userWithWallet.walletInfo?.address) {
      history.push({
        address: userWithWallet.walletInfo.address,
        connectedWallet: userWithWallet.walletInfo.connectedWallet,
        network: userWithWallet.walletInfo.network,
        connectedAt: userWithWallet.walletInfo.connectedAt,
        lastUsed: userWithWallet.walletInfo.lastUsed,
        status: "connected",
      });
    }

    // Legacy wallet address (if different from current)
    if (userWithWallet.wallet_address && 
        userWithWallet.wallet_address !== userWithWallet.walletInfo?.address) {
      history.push({
        address: userWithWallet.wallet_address,
        connectedWallet: "Legacy",
        network: "Unknown",
        connectedAt: userWithWallet.createdAt,
        lastUsed: null,
        status: "legacy",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        history,
        totalConnections: history.length,
      },
    });
  }
);
