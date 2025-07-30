import { IRSVP, RSVPStatus } from "../models/rsvpModel";

// Interface for event data from Sanity
interface EventData {
  _id: string;
  title: string;
  description: string;
  eventDate: string;
  endDate?: string;
  location: {
    type: string;
    venue: string;
    address?: string;
    virtualLink?: string;
    accessInstructions?: string;
  };
  organizer: {
    name: string;
    email: string;
    phone?: string;
    organization?: string;
  };
}

// Interface for template data
interface RSVPTemplateData {
  rsvp: IRSVP;
  event: EventData;
  user: {
    email: string;
    roles?: string[];
  };
  customMessage?: string;
}

/**
 * RSVP Confirmation Email Template
 */
export const rsvpConfirmationTemplate = (data: RSVPTemplateData): string => {
  const { rsvp, event, user } = data;
  const eventDate = new Date(event.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  const statusMessage = {
    [RSVPStatus.ATTENDING]: "We're excited to confirm your attendance!",
    [RSVPStatus.MAYBE]: "Thank you for your tentative response.",
    [RSVPStatus.NOT_ATTENDING]: "Thank you for letting us know you can't attend.",
    [RSVPStatus.WAITLISTED]: "You've been added to our waitlist. We'll notify you if a spot becomes available."
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RSVP Confirmation - ${event.title}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
            .attending { background: #10B981; color: white; }
            .maybe { background: #F59E0B; color: white; }
            .not-attending { background: #EF4444; color: white; }
            .waitlisted { background: #6366F1; color: white; }
            .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #374151; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
            .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>RSVP Confirmation</h1>
            <p>SI3 Events</p>
        </div>
        
        <div class="content">
            <h2>Hello!</h2>
            
            <p>Thank you for your RSVP to <strong>${event.title}</strong>.</p>
            
            <div class="status-badge ${rsvp.status.replace('_', '-')}">
                Status: ${statusMessage[rsvp.status]}
            </div>
            
            <div class="event-details">
                <h3>Event Details</h3>
                
                <div class="detail-row">
                    <span class="label">Event:</span> ${event.title}
                </div>
                
                <div class="detail-row">
                    <span class="label">Date & Time:</span> ${eventDate}
                </div>
                
                <div class="detail-row">
                    <span class="label">Location:</span> ${event.location.venue}
                    ${event.location.address ? `<br>${event.location.address}` : ''}
                </div>
                
                ${event.location.virtualLink ? `
                <div class="detail-row">
                    <span class="label">Virtual Link:</span> <a href="${event.location.virtualLink}">${event.location.virtualLink}</a>
                </div>
                ` : ''}
                
                <div class="detail-row">
                    <span class="label">Organizer:</span> ${event.organizer.name}
                    ${event.organizer.organization ? ` (${event.organizer.organization})` : ''}
                </div>
                
                ${rsvp.guestCount > 1 ? `
                <div class="detail-row">
                    <span class="label">Guests:</span> ${rsvp.guestCount} people
                </div>
                ` : ''}
                
                ${rsvp.dietaryRestrictions ? `
                <div class="detail-row">
                    <span class="label">Dietary Restrictions:</span> ${rsvp.dietaryRestrictions}
                </div>
                ` : ''}
                
                ${rsvp.specialRequests ? `
                <div class="detail-row">
                    <span class="label">Special Requests:</span> ${rsvp.specialRequests}
                </div>
                ` : ''}
            </div>
            
            ${rsvp.status === RSVPStatus.ATTENDING ? `
            <p>
                <a href="{{calendarLink}}" class="button">Add to Calendar</a>
            </p>
            ` : ''}
            
            ${rsvp.status === RSVPStatus.WAITLISTED ? `
            <p><strong>Waitlist Position:</strong> ${rsvp.waitlistPosition}</p>
            <p>We'll notify you immediately if a spot becomes available!</p>
            ` : ''}
            
            ${event.location.accessInstructions ? `
            <div style="background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <strong>Access Instructions:</strong><br>
                ${event.location.accessInstructions}
            </div>
            ` : ''}
            
            <p>If you need to update your RSVP, please contact us at ${event.organizer.email}.</p>
            
            <p>We look forward to seeing you!</p>
            
            <p>Best regards,<br>
            ${event.organizer.name}<br>
            SI3 Events Team</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message from SI3 Events. Please do not reply to this email.</p>
            <p>For questions, contact: ${event.organizer.email}</p>
        </div>
    </body>
    </html>
  `;
};

/**
 * Event Reminder Email Template
 */
export const eventReminderTemplate = (data: RSVPTemplateData & { reminderType: string }): string => {
  const { rsvp, event, user, reminderType, customMessage } = data;
  const eventDate = new Date(event.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  const reminderMessages = {
    '1_week': 'This is a friendly reminder that you have an upcoming event in one week.',
    '24_hours': 'Your event is tomorrow! Don\'t forget to attend.',
    '1_day': 'Your event is tomorrow! We\'re looking forward to seeing you.',
    '2_hours': 'Your event starts in just 2 hours! Time to get ready.'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Reminder - ${event.title}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .reminder-box { background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #374151; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
            .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔔 Event Reminder</h1>
            <p>SI3 Events</p>
        </div>
        
        <div class="content">
            <div class="reminder-box">
                <h2>Don't Forget!</h2>
                <p><strong>${reminderMessages[reminderType as keyof typeof reminderMessages]}</strong></p>
            </div>
            
            <div class="event-details">
                <h3>${event.title}</h3>
                
                <div class="detail-row">
                    <span class="label">Date & Time:</span> ${eventDate}
                </div>
                
                <div class="detail-row">
                    <span class="label">Location:</span> ${event.location.venue}
                    ${event.location.address ? `<br>${event.location.address}` : ''}
                </div>
                
                ${event.location.virtualLink ? `
                <div class="detail-row">
                    <span class="label">Join Link:</span> <a href="${event.location.virtualLink}">${event.location.virtualLink}</a>
                </div>
                ` : ''}
                
                ${rsvp.guestCount > 1 ? `
                <div class="detail-row">
                    <span class="label">Your Party Size:</span> ${rsvp.guestCount} people
                </div>
                ` : ''}
            </div>
            
            ${customMessage ? `
            <div style="background: #EBF8FF; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <strong>Special Message:</strong><br>
                ${customMessage}
            </div>
            ` : ''}
            
            ${event.location.accessInstructions ? `
            <div style="background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <strong>Access Instructions:</strong><br>
                ${event.location.accessInstructions}
            </div>
            ` : ''}
            
            <p style="text-align: center;">
                <a href="{{calendarLink}}" class="button">Add to Calendar</a>
                <a href="{{eventLink}}" class="button">View Event Details</a>
            </p>
            
            <p>If you can no longer attend, please update your RSVP by contacting ${event.organizer.email}.</p>
            
            <p>See you soon!</p>
            
            <p>Best regards,<br>
            ${event.organizer.name}<br>
            SI3 Events Team</p>
        </div>
        
        <div class="footer">
            <p>This is an automated reminder from SI3 Events.</p>
            <p>For questions, contact: ${event.organizer.email}</p>
        </div>
    </body>
    </html>
  `;
};

/**
 * Waitlist Notification Email Template
 */
export const waitlistNotificationTemplate = (data: RSVPTemplateData): string => {
  const { rsvp, event, user } = data;
  const eventDate = new Date(event.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Spot Available - ${event.title}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .success-box { background: #D1FAE5; border: 2px solid #10B981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #374151; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
            .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .urgent { background: #FEF2F2; border: 2px solid #EF4444; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎉 Great News!</h1>
            <p>A Spot is Now Available</p>
        </div>
        
        <div class="content">
            <div class="success-box">
                <h2>You're Off the Waitlist!</h2>
                <p><strong>A spot has opened up for ${event.title}</strong></p>
            </div>
            
            <div class="urgent">
                <strong>⏰ Time Sensitive:</strong> Please confirm your attendance within 24 hours to secure your spot.
            </div>
            
            <div class="event-details">
                <h3>Event Details</h3>
                
                <div class="detail-row">
                    <span class="label">Event:</span> ${event.title}
                </div>
                
                <div class="detail-row">
                    <span class="label">Date & Time:</span> ${eventDate}
                </div>
                
                <div class="detail-row">
                    <span class="label">Location:</span> ${event.location.venue}
                    ${event.location.address ? `<br>${event.location.address}` : ''}
                </div>
                
                ${rsvp.guestCount > 1 ? `
                <div class="detail-row">
                    <span class="label">Party Size:</span> ${rsvp.guestCount} people
                </div>
                ` : ''}
            </div>
            
            <p style="text-align: center;">
                <a href="{{confirmLink}}" class="button">Confirm Attendance</a>
            </p>
            
            <p>If you can no longer attend, please let us know so we can offer the spot to the next person on the waitlist.</p>
            
            <p>We're excited to have you join us!</p>
            
            <p>Best regards,<br>
            ${event.organizer.name}<br>
            SI3 Events Team</p>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from SI3 Events.</p>
            <p>For questions, contact: ${event.organizer.email}</p>
        </div>
    </body>
    </html>
  `;
};
