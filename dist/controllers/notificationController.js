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
exports.getNotificationSummary = exports.resetNotificationSettings = exports.updateNotificationSettings = exports.getNotificationSettings = void 0;
const usersModel_1 = __importDefault(require("../models/usersModel"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
/**
 * @desc    Get user notification settings
 * @route   GET /api/user/notification-settings
 * @access  Private
 */
exports.getNotificationSettings = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    // Get user with notification settings
    const userWithSettings = yield usersModel_1.default.findById(user._id).select('notificationSettings');
    if (!userWithSettings) {
        return next(new AppError_1.default("User not found", 404));
    }
    // Ensure default notification settings exist
    let notificationSettings = userWithSettings.notificationSettings;
    if (!notificationSettings) {
        // Create default settings if they don't exist
        notificationSettings = {
            emailUpdates: true,
            sessionReminder: true,
            marketingEmails: false,
            weeklyDigest: true,
            eventAnnouncements: true,
        };
        // Update user with default settings
        yield usersModel_1.default.findByIdAndUpdate(user._id, {
            notificationSettings,
            settingsUpdatedAt: new Date(),
        });
    }
    res.status(200).json({
        status: "success",
        data: notificationSettings,
    });
}));
/**
 * @desc    Update user notification settings
 * @route   PUT /api/user/notification-settings
 * @access  Private
 */
exports.updateNotificationSettings = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { emailUpdates, sessionReminder, marketingEmails, weeklyDigest, eventAnnouncements, } = req.body;
    // For PATCH requests, only validate provided fields
    const providedFields = Object.keys(req.body);
    const validFields = ['emailUpdates', 'sessionReminder', 'marketingEmails', 'weeklyDigest', 'eventAnnouncements'];
    // Check if any invalid fields are provided
    const invalidFields = providedFields.filter(field => !validFields.includes(field));
    if (invalidFields.length > 0) {
        return next(new AppError_1.default(`Invalid fields: ${invalidFields.join(', ')}`, 400));
    }
    // Validate that provided fields are boolean
    for (const field of providedFields) {
        if (typeof req.body[field] !== "boolean") {
            return next(new AppError_1.default(`Field '${field}' must be a boolean value`, 400));
        }
    }
    // Get current settings to merge with updates
    const currentUser = yield usersModel_1.default.findById(user._id).select('notificationSettings');
    if (!currentUser) {
        return next(new AppError_1.default("User not found", 404));
    }
    // Merge current settings with updates
    const currentSettings = currentUser.notificationSettings || {
        emailUpdates: true,
        sessionReminder: true,
        marketingEmails: false,
        weeklyDigest: true,
        eventAnnouncements: true,
    };
    const notificationSettings = {
        emailUpdates: emailUpdates !== undefined ? emailUpdates : currentSettings.emailUpdates,
        sessionReminder: sessionReminder !== undefined ? sessionReminder : currentSettings.sessionReminder,
        marketingEmails: marketingEmails !== undefined ? marketingEmails : currentSettings.marketingEmails,
        weeklyDigest: weeklyDigest !== undefined ? weeklyDigest : currentSettings.weeklyDigest,
        eventAnnouncements: eventAnnouncements !== undefined ? eventAnnouncements : currentSettings.eventAnnouncements,
    };
    // Update user notification settings
    const updatedUser = yield usersModel_1.default.findByIdAndUpdate(user._id, {
        notificationSettings,
        settingsUpdatedAt: new Date(),
    }, { new: true, runValidators: true }).select('notificationSettings settingsUpdatedAt');
    if (!updatedUser) {
        return next(new AppError_1.default("User not found", 404));
    }
    res.status(200).json({
        status: "success",
        message: "Notification settings updated successfully",
        data: {
            userId: updatedUser._id,
            notificationSettings: updatedUser.notificationSettings,
            updatedAt: updatedUser.settingsUpdatedAt,
        },
    });
}));
/**
 * @desc    Reset notification settings to defaults
 * @route   POST /api/user/notification-settings/reset
 * @access  Private
 */
exports.resetNotificationSettings = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const defaultSettings = {
        emailUpdates: true,
        sessionReminder: true,
        marketingEmails: false,
        weeklyDigest: true,
        eventAnnouncements: true,
    };
    // Update user with default settings
    const updatedUser = yield usersModel_1.default.findByIdAndUpdate(user._id, {
        notificationSettings: defaultSettings,
        settingsUpdatedAt: new Date(),
    }, { new: true, runValidators: true }).select('notificationSettings settingsUpdatedAt');
    if (!updatedUser) {
        return next(new AppError_1.default("User not found", 404));
    }
    res.status(200).json({
        status: "success",
        message: "Notification settings reset to defaults",
        data: {
            userId: updatedUser._id,
            notificationSettings: updatedUser.notificationSettings,
            updatedAt: updatedUser.settingsUpdatedAt,
        },
    });
}));
/**
 * @desc    Get notification settings summary
 * @route   GET /api/user/notification-settings/summary
 * @access  Private
 */
exports.getNotificationSummary = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userWithSettings = yield usersModel_1.default.findById(user._id).select('notificationSettings settingsUpdatedAt');
    if (!userWithSettings) {
        return next(new AppError_1.default("User not found", 404));
    }
    const settings = userWithSettings.notificationSettings || {
        emailUpdates: true,
        sessionReminder: true,
        marketingEmails: false,
        weeklyDigest: true,
        eventAnnouncements: true,
    };
    // Count enabled notifications
    const enabledCount = Object.values(settings).filter(Boolean).length;
    const totalCount = Object.keys(settings).length;
    res.status(200).json({
        status: "success",
        data: {
            notificationSettings: settings,
            summary: {
                enabledCount,
                totalCount,
                lastUpdated: userWithSettings.settingsUpdatedAt,
            },
        },
    });
}));
