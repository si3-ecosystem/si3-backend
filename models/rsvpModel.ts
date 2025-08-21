import mongoose, { Document, Schema, Types, Model } from "mongoose";

// Enums for RSVP status
export enum RSVPStatus {
  ATTENDING = "attending",
  NOT_ATTENDING = "not_attending", 
  MAYBE = "maybe",
  WAITLISTED = "waitlisted"
}

// Interface for contact information subdocument
export interface IContactInfo {
  phone?: string;
  emergencyContact?: string;
}

// Interface for the RSVP document
export interface IRSVP extends Document {
  _id: Types.ObjectId;
  
  // Event and user references
  eventId: string; // Sanity document ID
  userId: Types.ObjectId;
  
  // RSVP details
  status: RSVPStatus;
  guestCount: number;
  dietaryRestrictions?: string;
  specialRequests?: string;
  contactInfo?: IContactInfo;
  
  // Waitlist management
  waitlistPosition?: number;
  waitlistJoinedAt?: Date;
  
  // Admin fields
  adminNotes?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  
  // Email tracking
  confirmationEmailSent: boolean;
  reminderEmailsSent: string[]; // Array of reminder types sent
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Contact info schema
const contactInfoSchema = new Schema<IContactInfo>({
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone: string) {
        if (!phone) return true; // Optional field
        // Basic phone validation (allows various formats)
        return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
      },
      message: "Please provide a valid phone number"
    }
  },
  
  emergencyContact: {
    type: String,
    trim: true,
    maxlength: [200, "Emergency contact cannot exceed 200 characters"]
  }
}, { _id: false });

// RSVP schema definition
const rsvpSchema = new Schema<IRSVP>(
  {
    eventId: {
      type: String,
      required: [true, "Event ID is required"],
      trim: true,
      index: true,
      validate: {
        validator: function(eventId: string) {
          // Basic Sanity document ID validation (alphanumeric + hyphens)
          return /^[a-zA-Z0-9\-_]+$/.test(eventId);
        },
        message: "Please provide a valid Sanity event ID"
      }
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "SI3-User",
      required: [true, "User ID is required"],
      index: true
    },

    status: {
      type: String,
      required: [true, "RSVP status is required"],
      enum: {
        values: Object.values(RSVPStatus),
        message: "Invalid RSVP status selected"
      },
      index: true
    },

    guestCount: {
      type: Number,
      required: [true, "Guest count is required"],
      min: [1, "Guest count must be at least 1"],
      max: [20, "Guest count cannot exceed 20"],
      default: 1
    },

    dietaryRestrictions: {
      type: String,
      trim: true,
      maxlength: [500, "Dietary restrictions cannot exceed 500 characters"]
    },

    specialRequests: {
      type: String,
      trim: true,
      maxlength: [1000, "Special requests cannot exceed 1000 characters"]
    },

    contactInfo: {
      type: contactInfoSchema,
      default: null
    },

    waitlistPosition: {
      type: Number,
      min: [1, "Waitlist position must be positive"],
      index: true,
      sparse: true // Only index non-null values
    },

    waitlistJoinedAt: {
      type: Date,
      index: true,
      sparse: true
    },

    adminNotes: {
      type: String,
      trim: true,
      maxlength: [2000, "Admin notes cannot exceed 2000 characters"]
    },

    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved', // Most events auto-approve
      index: true
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "SI3-User",
      sparse: true
    },

    approvedAt: {
      type: Date,
      sparse: true
    },

    confirmationEmailSent: {
      type: Boolean,
      default: false,
      index: true
    },

    reminderEmailsSent: {
      type: [String],
      default: [],
      validate: {
        validator: function(reminders: string[]) {
          const validTypes = ['24_hours', '1_week', '1_day', '2_hours'];
          return reminders.every(type => validTypes.includes(type));
        },
        message: "Invalid reminder type"
      }
    }
  },
  {
    timestamps: true,
    collection: "si3RSVPs"
  }
);

// Compound indexes for optimal query performance
rsvpSchema.index({ eventId: 1, userId: 1 }, { unique: true }); // One RSVP per user per event
rsvpSchema.index({ eventId: 1, status: 1, createdAt: -1 });
rsvpSchema.index({ eventId: 1, waitlistPosition: 1 });
rsvpSchema.index({ userId: 1, status: 1, createdAt: -1 });
rsvpSchema.index({ status: 1, confirmationEmailSent: 1 });
rsvpSchema.index({ eventId: 1, approvalStatus: 1 });

// Virtual for populated user data
rsvpSchema.virtual("user", {
  ref: "SI3-User",
  localField: "userId", 
  foreignField: "_id",
  justOne: true
});

// Pre-save middleware
rsvpSchema.pre("save", function(next) {
  // Set waitlist fields when status is waitlisted
  if (this.status === RSVPStatus.WAITLISTED && !this.waitlistJoinedAt) {
    this.waitlistJoinedAt = new Date();
  }
  
  // Clear waitlist fields when not waitlisted
  if (this.status !== RSVPStatus.WAITLISTED) {
    this.waitlistPosition = undefined;
    this.waitlistJoinedAt = undefined;
  }
  
  // Set approval timestamp
  if (this.isModified("approvalStatus") && this.approvalStatus === "approved" && !this.approvedAt) {
    this.approvedAt = new Date();
  }
  
  next();
});

// Interface for the model with static methods
interface IRSVPModel extends Model<IRSVP> {
  getEventStats(eventId: string): Promise<{
    totalRSVPs: number;
    attending: number;
    notAttending: number;
    maybe: number;
    waitlisted: number;
    totalGuests: number;
  }>;
  getNextWaitlistPosition(eventId: string): Promise<number>;
}

// Static methods for common queries
rsvpSchema.statics.getEventStats = async function(eventId: string) {
  const stats = await this.aggregate([
    { $match: { eventId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalGuests: { $sum: "$guestCount" }
      }
    }
  ]);
  
  const result = {
    totalRSVPs: 0,
    attending: 0,
    notAttending: 0,
    maybe: 0,
    waitlisted: 0,
    totalGuests: 0
  };
  
  stats.forEach((stat: any) => {
    result.totalRSVPs += stat.count;
    switch (stat._id) {
      case RSVPStatus.ATTENDING:
        result.attending = stat.count;
        result.totalGuests += stat.totalGuests;
        break;
      case RSVPStatus.NOT_ATTENDING:
        result.notAttending = stat.count;
        break;
      case RSVPStatus.MAYBE:
        result.maybe = stat.count;
        break;
      case RSVPStatus.WAITLISTED:
        result.waitlisted = stat.count;
        break;
    }
  });
  
  return result;
};

rsvpSchema.statics.getNextWaitlistPosition = async function(eventId: string) {
  const lastPosition = await this.findOne(
    { eventId, status: RSVPStatus.WAITLISTED },
    { waitlistPosition: 1 }
  ).sort({ waitlistPosition: -1 });
  
  return (lastPosition?.waitlistPosition || 0) + 1;
};

// Error handling for duplicate RSVP
rsvpSchema.post("save", function(error: any, doc: any, next: any) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    console.log(`🚨 [RSVP MODEL DEBUG] MongoDB duplicate key error caught in post-save hook`);
    console.log(`   Error details:`, {
      name: error.name,
      code: error.code,
      message: error.message,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
    console.log(`   Document being saved:`, {
      eventId: doc?.eventId,
      userId: doc?.userId,
      status: doc?.status,
      id: doc?._id
    });

    // Check if it's the eventId+userId constraint (actual duplicate RSVP)
    if (error.keyPattern?.eventId && error.keyPattern?.userId) {
      next(new Error("User has already RSVP'd for this event"));
    } else {
      // For other duplicate key errors, provide more specific message
      const field = Object.keys(error.keyPattern || {})[0] || 'unknown field';
      next(new Error(`Duplicate value for ${field}. Please try again.`));
    }
  } else {
    next(error);
  }
});

// Create and export model
const RSVPModel = mongoose.model<IRSVP, IRSVPModel>("RSVP", rsvpSchema);

export default RSVPModel;
