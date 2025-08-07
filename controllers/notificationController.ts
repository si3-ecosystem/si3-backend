import { Request, Response, NextFunction } from "express";

import UserModel, { IUser, INotificationSettings } from "../models/usersModel";

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
 * @desc    Get user notification settings
 * @route   GET /api/user/notification-settings
 * @access  Private
 */
export const getNotificationSettings = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user as IUser;

    // Get user with notification settings
    const userWithSettings = await UserModel.findById(user._id).select('notificationSettings');
    
    if (!userWithSettings) {
      return next(new AppError("User not found", 404));
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
      await UserModel.findByIdAndUpdate(user._id, {
        notificationSettings,
        settingsUpdatedAt: new Date(),
      });
    }

    res.status(200).json({
      status: "success",
      data: notificationSettings,
    });
  }
);

/**
 * @desc    Update user notification settings
 * @route   PUT /api/user/notification-settings
 * @access  Private
 */
export const updateNotificationSettings = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user as IUser;
    const {
      emailUpdates,
      sessionReminder,
      marketingEmails,
      weeklyDigest,
      eventAnnouncements,
    } = req.body;

    // For PATCH requests, only validate provided fields
    const providedFields = Object.keys(req.body);
    const validFields = ['emailUpdates', 'sessionReminder', 'marketingEmails', 'weeklyDigest', 'eventAnnouncements'];

    // Check if any invalid fields are provided
    const invalidFields = providedFields.filter(field => !validFields.includes(field));
    if (invalidFields.length > 0) {
      return next(new AppError(`Invalid fields: ${invalidFields.join(', ')}`, 400));
    }

    // Validate that provided fields are boolean
    for (const field of providedFields) {
      if (typeof req.body[field] !== "boolean") {
        return next(new AppError(`Field '${field}' must be a boolean value`, 400));
      }
    }

    // Get current settings to merge with updates
    const currentUser = await UserModel.findById(user._id).select('notificationSettings');
    if (!currentUser) {
      return next(new AppError("User not found", 404));
    }

    // Merge current settings with updates
    const currentSettings = currentUser.notificationSettings || {
      emailUpdates: true,
      sessionReminder: true,
      marketingEmails: false,
      weeklyDigest: true,
      eventAnnouncements: true,
    };

    const notificationSettings: INotificationSettings = {
      emailUpdates: emailUpdates !== undefined ? emailUpdates : currentSettings.emailUpdates,
      sessionReminder: sessionReminder !== undefined ? sessionReminder : currentSettings.sessionReminder,
      marketingEmails: marketingEmails !== undefined ? marketingEmails : currentSettings.marketingEmails,
      weeklyDigest: weeklyDigest !== undefined ? weeklyDigest : currentSettings.weeklyDigest,
      eventAnnouncements: eventAnnouncements !== undefined ? eventAnnouncements : currentSettings.eventAnnouncements,
    };

    // Update user notification settings
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        notificationSettings,
        settingsUpdatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select('notificationSettings settingsUpdatedAt');

    if (!updatedUser) {
      return next(new AppError("User not found", 404));
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
  }
);

/**
 * @desc    Reset notification settings to defaults
 * @route   POST /api/user/notification-settings/reset
 * @access  Private
 */
export const resetNotificationSettings = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user as IUser;

    const defaultSettings: INotificationSettings = {
      emailUpdates: true,
      sessionReminder: true,
      marketingEmails: false,
      weeklyDigest: true,
      eventAnnouncements: true,
    };

    // Update user with default settings
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        notificationSettings: defaultSettings,
        settingsUpdatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select('notificationSettings settingsUpdatedAt');

    if (!updatedUser) {
      return next(new AppError("User not found", 404));
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
  }
);

/**
 * @desc    Get notification settings summary
 * @route   GET /api/user/notification-settings/summary
 * @access  Private
 */
export const getNotificationSummary = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user as IUser;

    const userWithSettings = await UserModel.findById(user._id).select('notificationSettings settingsUpdatedAt');
    
    if (!userWithSettings) {
      return next(new AppError("User not found", 404));
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
  }
);
