import { NotificationQueueModel, RSVPModel, EventCacheModel } from "../models/rsvpModels";
import emailService from "../config/protonMail";
import { Types } from "mongoose";

export interface NotificationData {
  eventTitle: string;
  eventDate: Date;
  eventLocation?: string;
  userEmail: string;
  userName: string;
  rsvpStatus: string;
  daysUntilEvent: number;
}

class NotificationService {
  /**
   * Process pending notifications
   */
  async processPendingNotifications(limit: number = 50): Promise<void> {
    try {
      const pendingNotifications = await NotificationQueueModel.getPendingNotifications(limit);
      
      for (const notification of pendingNotifications) {
        try {
          await this.sendNotification(notification);
          await NotificationQueueModel.markAsSent(notification._id);
        } catch (error) {
          console.error(`Failed to send notification ${notification._id}:`, error);
          await NotificationQueueModel.markAsFailed(
            notification._id, 
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }
    } catch (error) {
      console.error('Error processing pending notifications:', error);
    }
  }

  /**
   * Send individual notification
   */
  private async sendNotification(notification: any): Promise<void> {
    const { notificationType, rsvpId, userId } = notification;
    
    // Get RSVP and event data
    const rsvp = await RSVPModel.findById(rsvpId).populate('user', 'email');
    if (!rsvp) {
      throw new Error('RSVP not found');
    }

    const event = await EventCacheModel.findOne({ eventId: rsvp.eventId });
    if (!event) {
      throw new Error('Event not found');
    }

    const notificationData: NotificationData = {
      eventTitle: event.title,
      eventDate: event.startDate,
      eventLocation: event.location,
      userEmail: rsvp.user?.email || '',
      userName: rsvp.user?.email?.split('@')[0] || 'User',
      rsvpStatus: rsvp.status,
      daysUntilEvent: Math.ceil((event.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    };

    if (notificationType === 'email') {
      await this.sendEmailNotification(notificationData);
    } else if (notificationType === 'inApp') {
      await this.sendInAppNotification(notificationData, userId);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(data: NotificationData): Promise<void> {
    const subject = `Reminder: ${data.eventTitle} is ${data.daysUntilEvent} day${data.daysUntilEvent !== 1 ? 's' : ''} away`;
    
    const htmlContent = this.generateEmailTemplate(data);

    await emailService.sendEmail({
      senderName: "SI U Events",
      senderEmail: emailService.getSenderEmail("basic"),
      toName: data.userName,
      toEmail: data.userEmail,
      subject,
      htmlContent,
      emailType: "basic",
    });
  }

  /**
   * Send in-app notification (placeholder for future implementation)
   */
  private async sendInAppNotification(data: NotificationData, userId: Types.ObjectId): Promise<void> {
    // This would integrate with your in-app notification system
    // For now, we'll just log it
    console.log(`In-app notification for user ${userId}: ${data.eventTitle} reminder`);
  }

  /**
   * Generate email template for event reminders
   */
  private generateEmailTemplate(data: NotificationData): string {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .status-yes { background: #10B981; color: white; }
          .status-maybe { background: #F59E0B; color: white; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Event Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>This is a friendly reminder that <strong>${data.eventTitle}</strong> is coming up in ${data.daysUntilEvent} day${data.daysUntilEvent !== 1 ? 's' : ''}!</p>
            
            <div class="event-details">
              <h3>${data.eventTitle}</h3>
              <p><strong>Date & Time:</strong> ${formatDate(data.eventDate)}</p>
              ${data.eventLocation ? `<p><strong>Location:</strong> ${data.eventLocation}</p>` : ''}
              <p><strong>Your RSVP:</strong> <span class="status-badge status-${data.rsvpStatus}">${data.rsvpStatus}</span></p>
            </div>

            <p>We're looking forward to seeing you there!</p>
            
            <p>If you need to update your RSVP or have any questions, please contact us.</p>
          </div>
          <div class="footer">
            <p>This is an automated reminder from SI U Events</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Schedule notifications for an RSVP
   */
  async scheduleNotificationsForRSVP(rsvpId: Types.ObjectId): Promise<void> {
    try {
      const rsvp = await RSVPModel.findById(rsvpId);
      if (!rsvp) {
        throw new Error('RSVP not found');
      }

      const event = await EventCacheModel.findOne({ eventId: rsvp.eventId });
      if (!event) {
        throw new Error('Event not found');
      }

      const { notificationPreferences } = rsvp;
      const eventDate = new Date(event.startDate);

      // Clear existing notifications for this RSVP
      await NotificationQueueModel.deleteMany({ rsvpId });

      // Schedule new notifications
      for (const daysBefore of notificationPreferences.daysBefore) {
        const scheduledDate = new Date(eventDate);
        scheduledDate.setDate(scheduledDate.getDate() - daysBefore);

        // Don't schedule notifications for past dates
        if (scheduledDate <= new Date()) continue;

        if (notificationPreferences.email) {
          await NotificationQueueModel.create({
            rsvpId,
            eventId: rsvp.eventId,
            userId: rsvp.userId,
            notificationType: 'email',
            scheduledFor: scheduledDate,
          });
        }

        if (notificationPreferences.inApp) {
          await NotificationQueueModel.create({
            rsvpId,
            eventId: rsvp.eventId,
            userId: rsvp.userId,
            notificationType: 'inApp',
            scheduledFor: scheduledDate,
          });
        }
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      throw error;
    }
  }

  /**
   * Cancel notifications for an RSVP
   */
  async cancelNotificationsForRSVP(rsvpId: Types.ObjectId): Promise<void> {
    try {
      await NotificationQueueModel.deleteMany({ 
        rsvpId, 
        status: 'pending' 
      });
    } catch (error) {
      console.error('Error canceling notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<{
    pending: number;
    sent: number;
    failed: number;
    overdue: number;
  }> {
    const [pending, sent, failed, overdue] = await Promise.all([
      NotificationQueueModel.countDocuments({ status: 'pending' }),
      NotificationQueueModel.countDocuments({ status: 'sent' }),
      NotificationQueueModel.countDocuments({ status: 'failed' }),
      NotificationQueueModel.countDocuments({ 
        status: 'pending', 
        scheduledFor: { $lt: new Date() } 
      }),
    ]);

    return { pending, sent, failed, overdue };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
