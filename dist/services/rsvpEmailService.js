"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSVPEmailService = void 0;
const protonMail_1 = require("../config/protonMail");
const sanity_1 = require("../config/sanity");
const rsvpModel_1 = __importStar(require("../models/rsvpModel"));
const rsvpEmailTemplates_1 = require("../utils/rsvpEmailTemplates");
const si3EmailTemplate_1 = require("../utils/si3EmailTemplate");
class RSVPEmailService {
    /**
     * Send RSVP confirmation email
     */
    static sendConfirmationEmail(rsvpId, customMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log(`[RSVP EMAIL DEBUG] Starting confirmation email for RSVP: ${rsvpId}`);
            try {
                // Get RSVP with user data
                const rsvp = yield rsvpModel_1.default.findById(rsvpId).populate('user', 'email roles');
                if (!rsvp) {
                    console.error(`[RSVP EMAIL DEBUG] RSVP not found: ${rsvpId}`);
                    throw new Error('RSVP not found');
                }
                console.log(`[RSVP EMAIL DEBUG] RSVP found:`, {
                    rsvpId: rsvp._id,
                    userId: rsvp.userId,
                    eventId: rsvp.eventId,
                    userEmail: rsvp.user.email,
                    status: rsvp.status,
                    confirmationEmailSent: rsvp.confirmationEmailSent
                });
                // Get event data from Sanity
                const event = yield sanity_1.SanityEventService.getEventById(rsvp.eventId);
                if (!event) {
                    console.error(`[RSVP EMAIL DEBUG] Event not found in Sanity: ${rsvp.eventId}`);
                    throw new Error('Event not found');
                }
                console.log(`[RSVP EMAIL DEBUG] Event found:`, {
                    eventId: event._id,
                    title: event.title,
                    eventDate: event.eventDate,
                    organizer: event.organizer
                });
                // Generate calendar ICS file
                let icsContent;
                let calendarFilename;
                try {
                    const CalendarService = yield Promise.resolve().then(() => __importStar(require('./calendarService')));
                    icsContent = yield CalendarService.CalendarService.generateICSForRSVP(rsvpId);
                    calendarFilename = CalendarService.CalendarService.generateFilename(event.title, rsvpId);
                }
                catch (calendarError) {
                    console.error('Failed to generate calendar file:', calendarError);
                    // Continue without calendar attachment
                }
                // Generate secure token for public calendar access
                const calendarToken = Buffer.from(`${rsvp._id}:${rsvp.userId}:${rsvp.eventId}`).toString('base64');
                // Generate email content using beautiful SI3 template
                const baseUrl = process.env.API_BASE_URL || process.env.BASE_URL || 'http://localhost:8080';
                const htmlContent = (0, si3EmailTemplate_1.si3RSVPConfirmationTemplate)({
                    rsvp,
                    event,
                    user: rsvp.user,
                    customMessage,
                    includeCalendarLinks: true,
                    baseUrl,
                    calendarToken
                });
                // Prepare email data
                const emailData = {
                    toEmail: rsvp.user.email,
                    toName: rsvp.user.email,
                    subject: `RSVP Confirmation - ${event.title}`,
                    senderName: 'SI3 Events Team',
                    senderEmail: 'guides@si3.space',
                    htmlContent,
                    emailType: 'rsvp'
                };
                // Add calendar attachment if generated successfully
                if (icsContent && calendarFilename) {
                    emailData.attachments = [{
                            filename: calendarFilename,
                            content: icsContent,
                            contentType: 'text/calendar; charset=utf-8; method=REQUEST'
                        }];
                }
                console.log(`[RSVP EMAIL DEBUG] Sending email with data:`, {
                    toEmail: emailData.toEmail,
                    subject: emailData.subject,
                    senderEmail: emailData.senderEmail,
                    emailType: emailData.emailType,
                    hasAttachments: !!((_a = emailData.attachments) === null || _a === void 0 ? void 0 : _a.length)
                });
                // Send email
                const result = yield protonMail_1.emailService.sendEmail(emailData);
                console.log(`[RSVP EMAIL DEBUG] Email send result:`, {
                    success: result.success,
                    messageId: result.messageId,
                    smtpUsed: result.smtpUsed
                });
                if (result.success) {
                    // Mark confirmation email as sent
                    yield rsvpModel_1.default.findByIdAndUpdate(rsvpId, {
                        confirmationEmailSent: true
                    });
                    console.log(`[RSVP EMAIL DEBUG] Updated RSVP confirmationEmailSent flag to true`);
                }
                else {
                    console.error(`[RSVP EMAIL DEBUG] Email sending failed, not updating confirmationEmailSent flag`);
                }
                return result.success;
            }
            catch (error) {
                console.error(`[RSVP EMAIL DEBUG] Error sending confirmation email for RSVP ${rsvpId}:`, error);
                return false;
            }
        });
    }
    /**
     * Send event reminder email
     */
    static sendReminderEmail(rsvpId, reminderType, customMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get RSVP with user data
                const rsvp = yield rsvpModel_1.default.findById(rsvpId).populate('user', 'email roles');
                if (!rsvp) {
                    throw new Error('RSVP not found');
                }
                // Only send reminders to attending users
                if (rsvp.status !== rsvpModel_1.RSVPStatus.ATTENDING) {
                    return false;
                }
                // Check if this reminder type was already sent
                if (rsvp.reminderEmailsSent.includes(reminderType)) {
                    return false;
                }
                // Get event data from Sanity
                const event = yield sanity_1.SanityEventService.getEventById(rsvp.eventId);
                if (!event) {
                    throw new Error('Event not found');
                }
                // Generate email content
                const htmlContent = (0, rsvpEmailTemplates_1.eventReminderTemplate)({
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
                const result = yield protonMail_1.emailService.sendEmail({
                    toEmail: rsvp.user.email,
                    toName: rsvp.user.email,
                    subject: `${reminderTitles[reminderType]} - ${event.title}`,
                    senderName: event.organizer.name,
                    senderEmail: event.organizer.email,
                    htmlContent,
                    emailType: 'rsvp'
                });
                if (result.success) {
                    // Mark reminder as sent
                    yield rsvpModel_1.default.findByIdAndUpdate(rsvpId, {
                        $addToSet: { reminderEmailsSent: reminderType }
                    });
                }
                return result.success;
            }
            catch (error) {
                console.error('Error sending reminder email:', error);
                return false;
            }
        });
    }
    /**
     * Send waitlist notification email
     */
    static sendWaitlistNotification(rsvpId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get RSVP with user data
                const rsvp = yield rsvpModel_1.default.findById(rsvpId).populate('user', 'email roles');
                if (!rsvp) {
                    throw new Error('RSVP not found');
                }
                // Get event data from Sanity
                const event = yield sanity_1.SanityEventService.getEventById(rsvp.eventId);
                if (!event) {
                    throw new Error('Event not found');
                }
                // Generate email content
                const htmlContent = (0, rsvpEmailTemplates_1.waitlistNotificationTemplate)({
                    rsvp,
                    event,
                    user: rsvp.user
                });
                // Send email
                const result = yield protonMail_1.emailService.sendEmail({
                    toEmail: rsvp.user.email,
                    toName: rsvp.user.email,
                    subject: `Spot Available - ${event.title}`,
                    senderName: event.organizer.name,
                    senderEmail: event.organizer.email,
                    htmlContent,
                    emailType: 'rsvp'
                });
                return result.success;
            }
            catch (error) {
                console.error('Error sending waitlist notification:', error);
                return false;
            }
        });
    }
    /**
     * Send bulk reminder emails for an event
     */
    static sendBulkReminders(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { eventId, reminderType, customMessage, statusFilter = [rsvpModel_1.RSVPStatus.ATTENDING] } = data;
            try {
                // Get all RSVPs for the event
                const rsvps = yield rsvpModel_1.default.find({
                    eventId,
                    status: { $in: statusFilter },
                    reminderEmailsSent: { $ne: reminderType } // Haven't received this reminder yet
                }).populate('user', 'email roles');
                const results = {
                    sent: 0,
                    failed: 0,
                    errors: []
                };
                // Send reminders in batches to avoid overwhelming the email service
                const batchSize = 10;
                for (let i = 0; i < rsvps.length; i += batchSize) {
                    const batch = rsvps.slice(i, i + batchSize);
                    const batchPromises = batch.map((rsvp) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            const success = yield this.sendReminderEmail(rsvp._id.toString(), reminderType, customMessage);
                            if (success) {
                                results.sent++;
                            }
                            else {
                                results.failed++;
                                results.errors.push(`Failed to send reminder to ${rsvp.user.email}`);
                            }
                        }
                        catch (error) {
                            results.failed++;
                            results.errors.push(`Error sending to ${rsvp.user.email}: ${error}`);
                        }
                    }));
                    yield Promise.all(batchPromises);
                    // Add delay between batches to respect rate limits
                    if (i + batchSize < rsvps.length) {
                        yield new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                return results;
            }
            catch (error) {
                console.error('Error sending bulk reminders:', error);
                throw new Error('Failed to send bulk reminders');
            }
        });
    }
    /**
     * Process waitlist when spots become available
     */
    static processWaitlistNotifications(eventId, spotsAvailable) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get waitlisted users in order
                const waitlistedRSVPs = yield rsvpModel_1.default.find({
                    eventId,
                    status: rsvpModel_1.RSVPStatus.WAITLISTED
                })
                    .sort({ waitlistPosition: 1 })
                    .limit(spotsAvailable)
                    .populate('user', 'email roles');
                const results = {
                    notified: 0,
                    promoted: []
                };
                for (const rsvp of waitlistedRSVPs) {
                    try {
                        // Update RSVP status to attending
                        yield rsvpModel_1.default.findByIdAndUpdate(rsvp._id, {
                            status: rsvpModel_1.RSVPStatus.ATTENDING,
                            $unset: { waitlistPosition: 1, waitlistJoinedAt: 1 }
                        });
                        // Send notification email
                        const emailSent = yield this.sendWaitlistNotification(rsvp._id.toString());
                        if (emailSent) {
                            results.notified++;
                            results.promoted.push(rsvp.user.email);
                        }
                    }
                    catch (error) {
                        console.error(`Error processing waitlist for RSVP ${rsvp._id}:`, error);
                    }
                }
                return results;
            }
            catch (error) {
                console.error('Error processing waitlist notifications:', error);
                throw new Error('Failed to process waitlist notifications');
            }
        });
    }
    /**
     * Send RSVP update notification
     */
    static sendUpdateNotification(rsvpId, changes, customMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get RSVP with user data
                const rsvp = yield rsvpModel_1.default.findById(rsvpId).populate('user', 'email roles');
                if (!rsvp) {
                    throw new Error('RSVP not found');
                }
                // Get event data from Sanity
                const event = yield sanity_1.SanityEventService.getEventById(rsvp.eventId);
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
                const result = yield protonMail_1.emailService.sendEmail({
                    toEmail: rsvp.user.email,
                    toName: rsvp.user.email,
                    subject: `RSVP Updated - ${event.title}`,
                    senderName: event.organizer.name,
                    senderEmail: event.organizer.email,
                    htmlContent,
                    emailType: 'rsvp'
                });
                return result.success;
            }
            catch (error) {
                console.error('Error sending update notification:', error);
                return false;
            }
        });
    }
}
exports.RSVPEmailService = RSVPEmailService;
exports.default = RSVPEmailService;
