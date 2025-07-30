import { emailService } from "../config/protonMail";
import { SanityEventService } from "../config/sanity";
import RSVPModel, { IRSVP, RSVPStatus } from "../models/rsvpModel";
import UserModel from "../models/usersModel";
import {
  rsvpConfirmationTemplate,
  eventReminderTemplate,
  waitlistNotificationTemplate
} from "../utils/rsvpEmailTemplates";

// Types for email operations
export interface RSVPEmailData {
  rsvpId: string;
  eventId?: string;
  customMessage?: string;
  reminderType?: string;
}

export interface BulkEmailData {
  eventId: string;
  reminderType: string;
  customMessage?: string;
  statusFilter?: RSVPStatus[];
}

export class RSVPEmailService {
  /**
   * Send RSVP confirmation email
   */
  static async sendConfirmationEmail(rsvpId: string, customMessage?: string): Promise<boolean> {
    try {
      // Get RSVP with user data
      const rsvp = await RSVPModel.findById(rsvpId).populate('user', 'email roles');
      if (!rsvp) {
        throw new Error('RSVP not found');
      }

      // Get event data from Sanity
      const event = await SanityEventService.getEventById(rsvp.eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Generate email content
      const htmlContent = rsvpConfirmationTemplate({
        rsvp,
        event,
        user: rsvp.user,
        customMessage
      });

      // Send email
      const result = await emailService.sendEmail({
        toEmail: rsvp.user.email,
        toName: rsvp.user.email,
        subject: `RSVP Confirmation - ${event.title}`,
        senderName: event.organizer.name,
        senderEmail: event.organizer.email,
        htmlContent,
        emailType: 'rsvp'
      });

      if (result.success) {
        // Mark confirmation email as sent
        await RSVPModel.findByIdAndUpdate(rsvpId, {
          confirmationEmailSent: true
        });
      }

      return result.success;
    } catch (error) {
      console.error('Error sending RSVP confirmation email:', error);
      return false;
    }
  }

  /**
   * Send event reminder email
   */
  static async sendReminderEmail(
    rsvpId: string, 
    reminderType: string, 
    customMessage?: string
  ): Promise<boolean> {
    try {
      // Get RSVP with user data
      const rsvp = await RSVPModel.findById(rsvpId).populate('user', 'email roles');
      if (!rsvp) {
        throw new Error('RSVP not found');
      }

      // Only send reminders to attending users
      if (rsvp.status !== RSVPStatus.ATTENDING) {
        return false;
      }

      // Check if this reminder type was already sent
      if (rsvp.reminderEmailsSent.includes(reminderType)) {
        return false;
      }

      // Get event data from Sanity
      const event = await SanityEventService.getEventById(rsvp.eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Generate email content
      const htmlContent = eventReminderTemplate({
        rsvp,
        event,
        user: rsvp.user,
        reminderType,
        customMessage
      });

      const reminderTitles = {
        '1_week': 'One Week Reminder',
        '24_hours': '24 Hour Reminder',
        '1_day': 'Tomorrow Reminder',
        '2_hours': 'Starting Soon'
      };

      // Send email
      const result = await emailService.sendEmail({
        toEmail: rsvp.user.email,
        toName: rsvp.user.email,
        subject: `${reminderTitles[reminderType as keyof typeof reminderTitles]} - ${event.title}`,
        senderName: event.organizer.name,
        senderEmail: event.organizer.email,
        htmlContent,
        emailType: 'rsvp'
      });

      if (result.success) {
        // Mark reminder as sent
        await RSVPModel.findByIdAndUpdate(rsvpId, {
          $addToSet: { reminderEmailsSent: reminderType }
        });
      }

      return result.success;
    } catch (error) {
      console.error('Error sending reminder email:', error);
      return false;
    }
  }

  /**
   * Send waitlist notification email
   */
  static async sendWaitlistNotification(rsvpId: string): Promise<boolean> {
    try {
      // Get RSVP with user data
      const rsvp = await RSVPModel.findById(rsvpId).populate('user', 'email roles');
      if (!rsvp) {
        throw new Error('RSVP not found');
      }

      // Get event data from Sanity
      const event = await SanityEventService.getEventById(rsvp.eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Generate email content
      const htmlContent = waitlistNotificationTemplate({
        rsvp,
        event,
        user: rsvp.user
      });

      // Send email
      const result = await emailService.sendEmail({
        toEmail: rsvp.user.email,
        toName: rsvp.user.email,
        subject: `Spot Available - ${event.title}`,
        senderName: event.organizer.name,
        senderEmail: event.organizer.email,
        htmlContent,
        emailType: 'rsvp'
      });

      return result.success;
    } catch (error) {
      console.error('Error sending waitlist notification:', error);
      return false;
    }
  }

  /**
   * Send bulk reminder emails for an event
   */
  static async sendBulkReminders(data: BulkEmailData): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const { eventId, reminderType, customMessage, statusFilter = [RSVPStatus.ATTENDING] } = data;
    
    try {
      // Get all RSVPs for the event
      const rsvps = await RSVPModel.find({
        eventId,
        status: { $in: statusFilter },
        reminderEmailsSent: { $ne: reminderType } // Haven't received this reminder yet
      }).populate('user', 'email roles');

      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[]
      };

      // Send reminders in batches to avoid overwhelming the email service
      const batchSize = 10;
      for (let i = 0; i < rsvps.length; i += batchSize) {
        const batch = rsvps.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (rsvp) => {
          try {
            const success = await this.sendReminderEmail(
              rsvp._id.toString(),
              reminderType,
              customMessage
            );
            
            if (success) {
              results.sent++;
            } else {
              results.failed++;
              results.errors.push(`Failed to send reminder to ${rsvp.user.email}`);
            }
          } catch (error) {
            results.failed++;
            results.errors.push(`Error sending to ${rsvp.user.email}: ${error}`);
          }
        });

        await Promise.all(batchPromises);
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < rsvps.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return results;
    } catch (error) {
      console.error('Error sending bulk reminders:', error);
      throw new Error('Failed to send bulk reminders');
    }
  }

  /**
   * Process waitlist when spots become available
   */
  static async processWaitlistNotifications(
    eventId: string, 
    spotsAvailable: number
  ): Promise<{
    notified: number;
    promoted: string[];
  }> {
    try {
      // Get waitlisted users in order
      const waitlistedRSVPs = await RSVPModel.find({
        eventId,
        status: RSVPStatus.WAITLISTED
      })
      .sort({ waitlistPosition: 1 })
      .limit(spotsAvailable)
      .populate('user', 'email roles');

      const results = {
        notified: 0,
        promoted: [] as string[]
      };

      for (const rsvp of waitlistedRSVPs) {
        try {
          // Update RSVP status to attending
          await RSVPModel.findByIdAndUpdate(rsvp._id, {
            status: RSVPStatus.ATTENDING,
            $unset: { waitlistPosition: 1, waitlistJoinedAt: 1 }
          });

          // Send notification email
          const emailSent = await this.sendWaitlistNotification(rsvp._id.toString());
          
          if (emailSent) {
            results.notified++;
            results.promoted.push(rsvp.user.email);
          }
        } catch (error) {
          console.error(`Error processing waitlist for RSVP ${rsvp._id}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing waitlist notifications:', error);
      throw new Error('Failed to process waitlist notifications');
    }
  }

  /**
   * Send RSVP update notification
   */
  static async sendUpdateNotification(
    rsvpId: string, 
    changes: string[], 
    customMessage?: string
  ): Promise<boolean> {
    try {
      // Get RSVP with user data
      const rsvp = await RSVPModel.findById(rsvpId).populate('user', 'email roles');
      if (!rsvp) {
        throw new Error('RSVP not found');
      }

      // Get event data from Sanity
      const event = await SanityEventService.getEventById(rsvp.eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Generate simple update email
      const htmlContent = `
        <h2>RSVP Updated - ${event.title}</h2>
        <p>Your RSVP has been updated with the following changes:</p>
        <ul>
          ${changes.map(change => `<li>${change}</li>`).join('')}
        </ul>
        ${customMessage ? `<p><strong>Message:</strong> ${customMessage}</p>` : ''}
        <p>Event Date: ${new Date(event.eventDate).toLocaleDateString()}</p>
        <p>Location: ${event.location.venue}</p>
      `;

      // Send email
      const result = await emailService.sendEmail({
        toEmail: rsvp.user.email,
        toName: rsvp.user.email,
        subject: `RSVP Updated - ${event.title}`,
        senderName: event.organizer.name,
        senderEmail: event.organizer.email,
        htmlContent,
        emailType: 'rsvp'
      });

      return result.success;
    } catch (error) {
      console.error('Error sending update notification:', error);
      return false;
    }
  }
}

export default RSVPEmailService;
