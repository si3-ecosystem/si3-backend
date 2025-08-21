import { IRSVP, RSVPStatus } from '../models/rsvpModel';

// Interface for template data
interface SI3TemplateData {
  rsvp: IRSVP;
  event: any;
  user: {
    email: string;
    roles?: string[];
  };
  customMessage?: string;
  includeCalendarLinks?: boolean;
  baseUrl?: string;
  calendarToken?: string;
}

/**
 * SI3 Branded RSVP Confirmation Email Template
 * Matches the design style of your SI3 Secure Access Code template
 */
export const si3RSVPConfirmationTemplate = (data: SI3TemplateData): string => {
  const { rsvp, event, user, baseUrl, calendarToken, customMessage } = data;
  const apiBaseUrl = baseUrl || process.env.API_BASE_URL || 'http://localhost:8080';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RSVP Confirmation - ${event.title}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background: #F8FAFC;
                min-height: 100vh;
            }
            .email-container {
                max-width: 600px;
                margin: 40px auto;
                padding: 0 20px;
            }
            .email-card {
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #5B2C87 0%, #8B5CF6 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
                position: relative;
            }
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                opacity: 0.3;
            }
            .header-content {
                position: relative;
                z-index: 1;
            }
            .header h1 {
                margin: 0 0 8px 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.5px;
            }
            .header .subtitle {
                font-size: 16px;
                opacity: 0.9;
                margin: 0;
                font-weight: 400;
            }
            .status-container {
                margin: 20px 0 0 0;
            }
            .status-badge {
                display: inline-block;
                padding: 10px 24px;
                border-radius: 25px;
                font-weight: 600;
                text-transform: uppercase;
                font-size: 12px;
                letter-spacing: 0.5px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(10px);
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 18px;
                color: #1F2937;
                margin-bottom: 24px;
                font-weight: 500;
            }
            .section {
                margin: 32px 0;
                padding: 24px;
                border-radius: 12px;
                border: 1px solid #E5E7EB;
                background: #FAFBFC;
            }
            .section-title {
                margin: 0 0 20px 0;
                font-size: 18px;
                font-weight: 700;
                color: #1F2937;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .detail-grid {
                display: grid;
                gap: 16px;
            }
            .detail-item {
                display: flex;
                align-items: flex-start;
                gap: 16px;
                padding: 16px 0;
                border-bottom: 1px solid #F3F4F6;
            }
            .detail-item:last-child {
                border-bottom: none;
            }
            .detail-icon {
                font-size: 18px;
                width: 24px;
                text-align: center;
                margin-top: 2px;
                opacity: 0.8;
                flex-shrink: 0;
            }
            .detail-content {
                flex: 1;
            }
            .detail-label {
                font-weight: 600;
                color: #6B7280;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
            }
            .detail-value {
                color: #1F2937;
                font-size: 15px;
                font-weight: 500;
                line-height: 1.4;
            }
            .calendar-section {
                background: linear-gradient(135deg, #EBF8FF 0%, #DBEAFE 100%);
                border: 1px solid #BFDBFE;
                text-align: center;
            }
            .calendar-title {
                color: #1E40AF;
            }
            .message-highlight {
                background: #FEF3C7;
                border-left: 4px solid #F59E0B;
                padding: 16px;
                border-radius: 8px;
                margin: 24px 0;
            }
            .meeting-highlight {
                background: rgba(16, 185, 129, 0.1);
                border-left: 4px solid #10B981;
                padding: 16px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .inline-icon {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
            }
            .footer {
                background: #F9FAFB;
                padding: 32px 30px;
                text-align: center;
                border-top: 1px solid #E5E7EB;
            }
            .footer-text {
                color: #6B7280;
                font-size: 14px;
                margin: 6px 0;
                line-height: 1.5;
            }
            .footer-brand {
                color: #8B5CF6;
                font-weight: 600;
                margin-top: 16px;
                font-size: 15px;
            }
            .highlight {
                background: linear-gradient(135deg, #8B5CF6 0%, #5B2C87 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: 700;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-card">
                <!-- Header -->
                <div class="header">
                    <div class="header-content">
                        <h1>🎉 RSVP Confirmation</h1>
                        <p class="subtitle">SI3 Events • Secure Access</p>
                        <div class="status-container">
                            <div class="status-badge">
                                ${rsvp.status.replace('_', ' ')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Content -->
                <div class="content">
                    <div class="greeting">
                        Hello <span class="highlight">${user.email}</span>,
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.6; color: #4B5563; margin-bottom: 32px;">
                        Thank you for your RSVP! Your registration has been confirmed. Here are your event details:
                    </p>

                    <!-- Single Event Details Section -->
                    <div class="section">
                        <h3 class="section-title">
                            Event Details
                        </h3>

                        <!-- Event Information -->
                        <div class="detail-grid">
                            <div class="detail-item">
                                <div class="detail-content">
                                    <div class="detail-label">Event</div>
                                    <div class="detail-value">${event.title}</div>
                                </div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-content">
                                    <div class="detail-label">Date & Time</div>
                                    <div class="detail-value">${new Date(event.eventDate).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })} at ${new Date(event.eventDate).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZoneName: 'short'
                                    })}</div>
                                </div>
                            </div>
                            ${event.location ? `
                            <div class="detail-item">
                                <div class="detail-content">
                                    <div class="detail-label">Location</div>
                                    <div class="detail-value">
                                        ${event.location.type === 'virtual' ? 'Virtual Event' : (event.location.address || event.location.venue || 'TBD')}
                                        ${event.location?.type === 'virtual' && event.location?.virtualLink ? `<br><span style="color: #6B7280; font-size: 14px; margin-top: 4px; display: block;">${event.location.virtualLink}</span><a href="${event.location.virtualLink}" style="color: #3B82F6; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 4px; display: inline-block;">→ Join Meeting</a>` : ''}
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                            <div class="detail-item">
                                <div class="detail-content">
                                    <div class="detail-label">Attendees</div>
                                    <div class="detail-value">${rsvp.guestCount} ${rsvp.guestCount === 1 ? 'person' : 'people'}</div>
                                </div>
                            </div>
                            ${rsvp.dietaryRestrictions ? `
                            <div class="detail-item">
                                <div class="detail-content">
                                    <div class="detail-label">Dietary Requirements</div>
                                    <div class="detail-value">${rsvp.dietaryRestrictions}</div>
                                </div>
                            </div>
                            ` : ''}
                        </div>

                        ${customMessage ? `
                        <!-- Special Message -->
                        <div style="margin-top: 24px; padding: 16px; background: #FEF3C7; border-radius: 8px; border-left: 4px solid #F59E0B;">
                            <div style="display: flex; align-items: flex-start; gap: 8px;">
                                <div>
                                    <div style="font-weight: 600; color: #92400E; font-size: 14px; margin-bottom: 4px;">SPECIAL MESSAGE</div>
                                    <div style="color: #92400E; font-size: 15px; line-height: 1.5;">${customMessage}</div>
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        ${rsvp.status === RSVPStatus.ATTENDING ? `
                        <!-- Add to Calendar -->
                        <div style="margin-top: 32px; padding: 24px; background: linear-gradient(135deg, #EBF8FF 0%, #DBEAFE 100%); border-radius: 12px; border: 1px solid #BFDBFE; text-align: center;">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 16px;">
                                <h4 style="margin: 0; color: #1E40AF; font-size: 18px; font-weight: 700;">Add to Your Calendar</h4>
                            </div>

                            <p style="margin: 0 0 20px 0; color: #1E40AF; font-size: 15px;">Don't miss this event! Add it to your calendar with one click:</p>

                            <!-- Primary Google Calendar Button -->
                            <a href="${apiBaseUrl}/api/rsvp/${rsvp._id}/calendar/public?format=google&token=${calendarToken}"
                               style="display: inline-block; background: #4285F4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 8px; box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3);">
                                📅 Add to Google Calendar
                            </a>

                            <!-- Quick Tip -->
                            <div style="margin: 20px 0; padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.2);">
                                <p style="margin: 0; font-size: 13px; color: #1E40AF; font-style: italic;">
                                    💡 <strong>Quick tip:</strong> Click the button above, then click "Save" in Google Calendar to add the event.
                                </p>
                            </div>

                            <!-- Other Options -->
                            <div style="border-top: 1px solid rgba(59, 130, 246, 0.2); padding-top: 16px; margin-top: 16px;">
                                <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 14px;">Other calendar options:</p>
                                <a href="${apiBaseUrl}/api/rsvp/${rsvp._id}/calendar/public?format=outlook&token=${calendarToken}"
                                   style="display: inline-block; background: #0078D4; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; margin: 4px;">
                                    Outlook Calendar
                                </a>
                                <a href="${apiBaseUrl}/api/rsvp/${rsvp._id}/calendar/public?format=ics&token=${calendarToken}"
                                   style="display: inline-block; background: #6B7280; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; margin: 4px;">
                                    Download ICS File
                                </a>
                            </div>

                            <p style="margin: 16px 0 0 0; font-size: 12px; color: #6B7280;">📎 A calendar file (.ics) is also attached to this email</p>
                        </div>
                        ` : ''}

                        ${event.location?.type === 'virtual' && event.location?.virtualLink && event.location?.accessInstructions ? `
                        <!-- Virtual Meeting Instructions -->
                        <div style="margin-top: 20px; padding: 16px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border-left: 4px solid #10B981;">
                            <div style="display: flex; align-items: flex-start; gap: 8px;">
                                <span style="font-size: 16px;">💡</span>
                                <div>
                                    <div style="font-weight: 600; color: #065F46; font-size: 14px; margin-bottom: 4px;">MEETING INSTRUCTIONS</div>
                                    <div style="color: #065F46; font-size: 14px; line-height: 1.5;">${event.location.accessInstructions}</div>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>

                    <p style="margin-top: 40px; font-size: 16px; line-height: 1.6; color: #4B5563;">
                        We're excited to see you at the event! If you have any questions or need to make changes to your RSVP, please don't hesitate to reach out.
                    </p>
                    
                    <p style="margin-top: 32px; font-size: 16px; color: #1F2937;">
                        Best regards,<br>
                        <strong>${event.organizer?.name || 'SI3 Events Team'}</strong><br>
                        <span class="highlight">SI3 Events Team</span>
                    </p>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <p class="footer-text">This is an automated message from SI3 Events.</p>
                    <p class="footer-text">For questions or support, contact: <strong>${event.organizer?.email || 'guides@si3.space'}</strong></p>
                    <p class="footer-brand">SI3 • si3.space</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};
