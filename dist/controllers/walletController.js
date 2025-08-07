"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletHistory = exports.updateWalletActivity = exports.disconnectWallet = exports.connectWallet = exports.getWalletInfo = void 0;
const usersModel_1 = __importDefault(require("../models/usersModel"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
/**
 * @desc    Get user wallet information
 * @route   GET /api/user/wallet/info
 * @access  Private
 */
exports.getWalletInfo = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userWithWallet = yield usersModel_1.default.findById(user._id).select('walletInfo wallet_address');
    if (!userWithWallet) {
        return next(new AppError_1.default("User not found", 404));
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
        yield usersModel_1.default.findByIdAndUpdate(user._id, {
            walletInfo,
            settingsUpdatedAt: new Date(),
        });
    }
    res.status(200).json({
        status: "success",
        data: {
            walletInfo: walletInfo || null,
            isConnected: !!(walletInfo === null || walletInfo === void 0 ? void 0 : walletInfo.address),
        },
    });
}));
/**
 * @desc    Connect wallet to user account
 * @route   POST /api/user/wallet/connect
 * @access  Private
 */
exports.connectWallet = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { address, connectedWallet, network } = req.body;
    // Validate Ethereum address format
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return next(new AppError_1.default("Please provide a valid Ethereum address", 400));
    }
    // Validate wallet type
    const validWallets = ["Zerion", "MetaMask", "WalletConnect", "Other"];
    if (connectedWallet && !validWallets.includes(connectedWallet)) {
        return next(new AppError_1.default("Invalid wallet type", 400));
    }
    // Validate network
    const validNetworks = ["Mainnet", "Polygon", "Arbitrum", "Base", "Optimism"];
    if (network && !validNetworks.includes(network)) {
        return next(new AppError_1.default("Invalid network", 400));
    }
    // Check if wallet address is already connected to another user
    const existingUser = yield usersModel_1.default.findOne({
        $or: [
            { "walletInfo.address": address },
            { wallet_address: address }
        ],
        _id: { $ne: user._id }
    });
    if (existingUser) {
        return next(new AppError_1.default("This wallet address is already connected to another account", 400));
    }
    const walletInfo = {
        address: address.toLowerCase(),
        connectedWallet: connectedWallet || "Other",
        network: network || "Mainnet",
        connectedAt: new Date(),
        lastUsed: new Date(),
    };
    // Update user with wallet information
    const updatedUser = yield usersModel_1.default.findByIdAndUpdate(user._id, {
        walletInfo,
        wallet_address: address.toLowerCase(), // Keep legacy field for compatibility
        settingsUpdatedAt: new Date(),
    }, { new: true, runValidators: true }).select('walletInfo settingsUpdatedAt');
    if (!updatedUser) {
        return next(new AppError_1.default("User not found", 404));
    }
    res.status(200).json({
        status: "success",
        message: "Wallet connected successfully",
        data: {
            walletInfo: updatedUser.walletInfo,
            updatedAt: updatedUser.settingsUpdatedAt,
        },
    });
}));
/**
 * @desc    Disconnect wallet from user account
 * @route   DELETE /api/user/wallet/disconnect
 * @access  Private
 */
exports.disconnectWallet = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    // Update user to remove wallet information
    const updatedUser = yield usersModel_1.default.findByIdAndUpdate(user._id, {
        $unset: {
            walletInfo: "",
            wallet_address: "", // Remove legacy field too
        },
        settingsUpdatedAt: new Date(),
    }, { new: true, runValidators: true }).select('settingsUpdatedAt');
    if (!updatedUser) {
        return next(new AppError_1.default("User not found", 404));
    }
    res.status(200).json({
        status: "success",
        message: "Wallet disconnected successfully",
        data: {
            updatedAt: updatedUser.settingsUpdatedAt,
        },
    });
}));
/**
 * @desc    Update wallet last used timestamp
 * @route   PATCH /api/user/wallet/activity
 * @access  Private
 */
exports.updateWalletActivity = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user;
    const userWithWallet = yield usersModel_1.default.findById(user._id).select('walletInfo');
    if (!userWithWallet || !((_a = userWithWallet.walletInfo) === null || _a === void 0 ? void 0 : _a.address)) {
        return next(new AppError_1.default("No wallet connected to this account", 400));
    }
    // Update last used timestamp
    const updatedUser = yield usersModel_1.default.findByIdAndUpdate(user._id, {
        "walletInfo.lastUsed": new Date(),
        settingsUpdatedAt: new Date(),
    }, { new: true, runValidators: true }).select('walletInfo settingsUpdatedAt');
    if (!updatedUser) {
        return next(new AppError_1.default("User not found", 404));
    }
    res.status(200).json({
        status: "success",
        message: "Wallet activity updated",
        data: {
            walletInfo: updatedUser.walletInfo,
            updatedAt: updatedUser.settingsUpdatedAt,
        },
    });
}));
/**
 * @desc    Get wallet connection history
 * @route   GET /api/user/wallet/history
 * @access  Private
 */
exports.getWalletHistory = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = req.user;
    const userWithWallet = yield usersModel_1.default.findById(user._id).select('walletInfo wallet_address createdAt');
    if (!userWithWallet) {
        return next(new AppError_1.default("User not found", 404));
    }
    const history = [];
    // Current wallet info
    if ((_a = userWithWallet.walletInfo) === null || _a === void 0 ? void 0 : _a.address) {
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
        userWithWallet.wallet_address !== ((_b = userWithWallet.walletInfo) === null || _b === void 0 ? void 0 : _b.address)) {
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
}));
