import mongoose, { Document, Schema, Types, Model } from "mongoose";
import { UserRole } from "./usersModel";

// RSVP Response Types
export enum RSVPStatus {
  YES = "yes",
  NO = "no", 
  MAYBE = "maybe",
}

// Event Types
export enum EventType {
  GUIDE_SESSION = "guide_session",
  GUIDE_IDEAS_LAB = "guide_ideas_lab",
  SCHOLAR_SESSION = "scholar_session", 
  SCHOLAR_IDEAS_LAB = "scholar_ideas_lab",
  GENERAL_EVENT = "general_event",
}

// Event type to role mapping for access control
export const EVENT_ACCESS_MAP: Record<EventType, UserRole[]> = {
  [EventType.GUIDE_SESSION]: [UserRole.GUIDE, UserRole.ADMIN],
  [EventType.GUIDE_IDEAS_LAB]: [UserRole.GUIDE, UserRole.ADMIN],
  [EventType.SCHOLAR_SESSION]: [UserRole.SCHOLAR, UserRole.ADMIN],
  [EventType.SCHOLAR_IDEAS_LAB]: [UserRole.SCHOLAR, UserRole.ADMIN],
  [EventType.GENERAL_EVENT]: [UserRole.GUIDE, UserRole.SCHOLAR, UserRole.ADMIN, UserRole.PARTNER],
};

// Notification preferences interface
export interface INotificationPreference {
  email: boolean;
  inApp: boolean;
  daysBefore: number[];
}

// RSVP interface
export interface IRSVP extends Document {
  _id: Types.ObjectId;
  eventId: string;
  eventType: EventType;
  userId: Types.ObjectId;
  status: RSVPStatus;
  notificationPreferences: INotificationPreference;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: any;
  event?: any;
}

// Event cache interface
export interface IEventCache extends Document {
  _id: Types.ObjectId;
  eventId: string;
  title: string;
  description?: string;
  eventType: EventType;
  startDate: Date;
  endDate?: Date;
  location?: string;
  maxAttendees?: number;
  isActive: boolean;
  sanityData: any;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Notification queue interface
export interface INotificationQueue extends Document {
  _id: Types.ObjectId;
  rsvpId: Types.ObjectId;
  eventId: string;
  userId: Types.ObjectId;
  notificationType: 'email' | 'inApp';
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  lastAttemptAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Static methods interfaces
export interface IRSVPModel extends Model<IRSVP> {
  findByEventId(eventId: string, options?: any): Promise<IRSVP[]>;
  findUserRSVPs(userId: Types.ObjectId, options?: any): Promise<IRSVP[]>;
  getEventStats(eventId: string): Promise<any>;
  createOrUpdateRSVP(eventId: string, userId: Types.ObjectId, status: RSVPStatus, options?: any): Promise<IRSVP>;
}

export interface IEventCacheModel extends Model<IEventCache> {
  syncFromSanity(eventId: string, sanityData: any): Promise<IEventCache>;
  findUpcomingEvents(eventType?: EventType): Promise<IEventCache[]>;
  cleanupExpiredEvents(): Promise<number>;
}

export interface INotificationQueueModel extends Model<INotificationQueue> {
  scheduleNotifications(rsvpId: Types.ObjectId): Promise<INotificationQueue[]>;
  getPendingNotifications(limit?: number): Promise<INotificationQueue[]>;
  markAsSent(notificationId: Types.ObjectId): Promise<void>;
  markAsFailed(notificationId: Types.ObjectId, error: string): Promise<void>;
}

// Default notification preferences
const defaultNotificationPreferences: INotificationPreference = {
  email: true,
  inApp: true,
  daysBefore: [7, 1],
};

// RSVP Schema
const rsvpSchema = new Schema<IRSVP>(
  {
    eventId: {
      type: String,
      required: [true, "Event ID is required"],
      trim: true,
      index: true,
      validate: {
        validator: function (eventId: string) {
          return /^[a-zA-Z0-9_-]+$/.test(eventId);
        },
        message: "Please provide a valid Sanity event ID",
      },
    },

    eventType: {
      type: String,
      required: [true, "Event type is required"],
      enum: {
        values: Object.values(EventType),
        message: "Invalid event type selected",
      },
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "SI3-User",
      required: [true, "User ID is required"],
      index: true,
    },

    status: {
      type: String,
      required: [true, "RSVP status is required"],
      enum: {
        values: Object.values(RSVPStatus),
        message: "Invalid RSVP status",
      },
      index: true,
    },

    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      inApp: {
        type: Boolean,
        default: true,
      },
      daysBefore: {
        type: [Number],
        default: [7, 1],
        validate: {
          validator: function (days: number[]) {
            return days.every(day => day > 0 && day <= 365);
          },
          message: "Days before must be between 1 and 365",
        },
      },
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    collection: "si3RSVPs",
  }
);

// Event Cache Schema
const eventCacheSchema = new Schema<IEventCache>(
  {
    eventId: {
      type: String,
      required: [true, "Event ID is required"],
      unique: true,
      trim: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    eventType: {
      type: String,
      required: [true, "Event type is required"],
      enum: Object.values(EventType),
      index: true,
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      index: true,
    },

    endDate: {
      type: Date,
      validate: {
        validator: function (this: IEventCache, endDate: Date) {
          return !endDate || endDate > this.startDate;
        },
        message: "End date must be after start date",
      },
    },

    location: {
      type: String,
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },

    maxAttendees: {
      type: Number,
      min: [1, "Max attendees must be at least 1"],
      max: [10000, "Max attendees cannot exceed 10,000"],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    sanityData: {
      type: Schema.Types.Mixed,
      required: [true, "Sanity data is required"],
    },

    lastSyncedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "si3EventCache",
  }
);

// Notification Queue Schema
const notificationQueueSchema = new Schema<INotificationQueue>(
  {
    rsvpId: {
      type: Schema.Types.ObjectId,
      ref: "RSVP",
      required: [true, "RSVP ID is required"],
      index: true,
    },

    eventId: {
      type: String,
      required: [true, "Event ID is required"],
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "SI3-User",
      required: [true, "User ID is required"],
      index: true,
    },

    notificationType: {
      type: String,
      required: [true, "Notification type is required"],
      enum: ['email', 'inApp'],
      index: true,
    },

    scheduledFor: {
      type: Date,
      required: [true, "Scheduled time is required"],
      index: true,
    },

    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
      index: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: [0, "Attempts cannot be negative"],
      max: [5, "Maximum 5 attempts allowed"],
    },

    lastAttemptAt: {
      type: Date,
    },

    errorMessage: {
      type: String,
      trim: true,
      maxlength: [1000, "Error message cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
    collection: "si3NotificationQueue",
  }
);

// Compound indexes for optimal query performance
rsvpSchema.index({ eventId: 1, userId: 1 }, { unique: true }); // Prevent duplicate RSVPs
rsvpSchema.index({ eventId: 1, status: 1 });
rsvpSchema.index({ userId: 1, createdAt: -1 });
rsvpSchema.index({ eventType: 1, status: 1 });

eventCacheSchema.index({ eventType: 1, startDate: 1 });
eventCacheSchema.index({ isActive: 1, startDate: 1 });
eventCacheSchema.index({ lastSyncedAt: 1 });

notificationQueueSchema.index({ status: 1, scheduledFor: 1 });
notificationQueueSchema.index({ rsvpId: 1, notificationType: 1 });
notificationQueueSchema.index({ userId: 1, status: 1 });

// Virtual for populated user data
rsvpSchema.virtual("user", {
  ref: "SI3-User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for populated event data
rsvpSchema.virtual("event", {
  ref: "EventCache",
  localField: "eventId",
  foreignField: "eventId",
  justOne: true,
});

// Ensure virtual fields are serialized
rsvpSchema.set("toJSON", { virtuals: true });
rsvpSchema.set("toObject", { virtuals: true });

// RSVP Static Methods
rsvpSchema.statics.findByEventId = function (
  eventId: string,
  options: { includeUser?: boolean; status?: RSVPStatus } = {}
) {
  const query = this.find({ eventId });

  if (options.status) {
    query.where({ status: options.status });
  }

  if (options.includeUser) {
    query.populate('user', 'email roles');
  }

  return query.sort({ createdAt: -1 });
};

rsvpSchema.statics.findUserRSVPs = function (
  userId: Types.ObjectId,
  options: { limit?: number; skip?: number; upcoming?: boolean } = {}
) {
  const query = this.find({ userId });

  if (options.upcoming) {
    // Join with event cache to filter upcoming events
    return this.aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: "si3EventCache",
          localField: "eventId",
          foreignField: "eventId",
          as: "event",
        },
      },
      { $unwind: "$event" },
      { $match: { "event.startDate": { $gte: new Date() } } },
      { $sort: { "event.startDate": 1 } },
      ...(options.skip ? [{ $skip: options.skip }] : []),
      ...(options.limit ? [{ $limit: options.limit }] : []),
    ]);
  }

  return query
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 20);
};

rsvpSchema.statics.getEventStats = function (eventId: string) {
  return this.aggregate([
    { $match: { eventId } },
    {
      $group: {
        _id: null,
        totalRSVPs: { $sum: 1 },
        yesCount: {
          $sum: { $cond: [{ $eq: ["$status", RSVPStatus.YES] }, 1, 0] },
        },
        noCount: {
          $sum: { $cond: [{ $eq: ["$status", RSVPStatus.NO] }, 1, 0] },
        },
        maybeCount: {
          $sum: { $cond: [{ $eq: ["$status", RSVPStatus.MAYBE] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: "si3RSVPs",
        let: { eventId: eventId },
        pipeline: [
          { $match: { $expr: { $eq: ["$eventId", "$$eventId"] }, status: RSVPStatus.YES } },
          {
            $lookup: {
              from: "si3Users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
              pipeline: [{ $project: { email: 1, roles: 1 } }],
            },
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        ],
        as: "attendeeList",
      },
    },
    {
      $project: {
        _id: 0,
        totalRSVPs: 1,
        yesCount: 1,
        noCount: 1,
        maybeCount: 1,
        attendeeList: 1,
      },
    },
  ]).then(results => results[0] || {
    totalRSVPs: 0,
    yesCount: 0,
    noCount: 0,
    maybeCount: 0,
    attendeeList: [],
  });
};

rsvpSchema.statics.createOrUpdateRSVP = async function (
  eventId: string,
  userId: Types.ObjectId,
  status: RSVPStatus,
  options: { notes?: string; notificationPreferences?: INotificationPreference } = {}
) {
  const rsvp = await this.findOneAndUpdate(
    { eventId, userId },
    {
      status,
      notes: options.notes,
      notificationPreferences: options.notificationPreferences || defaultNotificationPreferences,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  return rsvp;
};

// Event Cache Static Methods
eventCacheSchema.statics.syncFromSanity = function (eventId: string, sanityData: any) {
  return this.findOneAndUpdate(
    { eventId },
    {
      title: sanityData.title,
      description: sanityData.description,
      eventType: sanityData.eventType,
      startDate: new Date(sanityData.startDate),
      endDate: sanityData.endDate ? new Date(sanityData.endDate) : undefined,
      location: sanityData.location,
      maxAttendees: sanityData.maxAttendees,
      isActive: sanityData.isActive !== false,
      sanityData,
      lastSyncedAt: new Date(),
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );
};

eventCacheSchema.statics.findUpcomingEvents = function (eventType?: EventType) {
  const query = this.find({
    startDate: { $gte: new Date() },
    isActive: true,
  });

  if (eventType) {
    query.where({ eventType });
  }

  return query.sort({ startDate: 1 });
};

eventCacheSchema.statics.cleanupExpiredEvents = function () {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return this.deleteMany({
    startDate: { $lt: thirtyDaysAgo },
  }).then((result: any) => result.deletedCount || 0);
};

// Notification Queue Static Methods
notificationQueueSchema.statics.scheduleNotifications = async function (rsvpId: Types.ObjectId) {
  // Will be implemented with notification service
  return [];
};

notificationQueueSchema.statics.getPendingNotifications = function (limit: number = 100) {
  return this.find({
    status: 'pending',
    scheduledFor: { $lte: new Date() },
    attempts: { $lt: 5 },
  })
  .populate('rsvpId')
  .populate('userId', 'email roles')
  .sort({ scheduledFor: 1 })
  .limit(limit);
};

notificationQueueSchema.statics.markAsSent = function (notificationId: Types.ObjectId) {
  return this.findByIdAndUpdate(notificationId, {
    status: 'sent',
    lastAttemptAt: new Date(),
    $inc: { attempts: 1 },
  });
};

notificationQueueSchema.statics.markAsFailed = function (notificationId: Types.ObjectId, error: string) {
  return this.findByIdAndUpdate(notificationId, {
    status: 'failed',
    errorMessage: error,
    lastAttemptAt: new Date(),
    $inc: { attempts: 1 },
  });
};

// Create and export models
const RSVPModel = mongoose.model<IRSVP, IRSVPModel>("RSVP", rsvpSchema);
const EventCacheModel = mongoose.model<IEventCache, IEventCacheModel>("EventCache", eventCacheSchema);
const NotificationQueueModel = mongoose.model<INotificationQueue, INotificationQueueModel>("NotificationQueue", notificationQueueSchema);

export { RSVPModel, EventCacheModel, NotificationQueueModel };
export default RSVPModel;
