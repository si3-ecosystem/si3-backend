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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const sanity_1 = require("../config/sanity");
const redisHelper_1 = __importDefault(require("../helpers/redisHelper"));
class CalendarService {
    /**
     * Generate ICS calendar file content for an RSVP
     */
    static generateICSForRSVP(rsvpId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check cache first
                const cacheKey = `calendar_ics_${rsvpId}`;
                const cachedICS = yield redisHelper_1.default.cacheGet(cacheKey);
                if (cachedICS) {
                    return cachedICS;
                }
                // Get RSVP with user data
                const rsvp = yield Promise.resolve().then(() => __importStar(require("../models/rsvpModel"))).then(m => m.default.findById(rsvpId).populate('user', 'email roles'));
                if (!rsvp) {
                    throw new Error('RSVP not found');
                }
                // Get event data from Sanity
                const event = yield sanity_1.SanityEventService.getEventById(rsvp.eventId);
                if (!event) {
                    throw new Error('Event not found');
                }
                // Prepare calendar event data
                const calendarData = {
                    title: event.title,
                    description: CalendarService.formatEventDescription(event, rsvp),
                    startDate: new Date(event.eventDate),
                    endDate: event.endDate ? new Date(event.endDate) : CalendarService.calculateEndDate(new Date(event.eventDate)),
                    location: CalendarService.formatLocation(event.location),
                    organizer: {
                        name: event.organizer.name,
                        email: event.organizer.email
                    },
                    attendee: {
                        name: rsvp.user.email,
                        email: rsvp.user.email
                    },
                    uid: `rsvp-${rsvpId}@si3.space`,
                    url: `${process.env.FRONTEND_URL || 'https://si3.space'}/events/${event.slug || event._id}`
                };
                // Generate ICS content
                const icsContent = CalendarService.generateICSContent(calendarData);
                // Cache the ICS content for 1 hour (calendar data doesn't change frequently)
                yield redisHelper_1.default.cacheSet(cacheKey, icsContent, 3600);
                return icsContent;
            }
            catch (error) {
                console.error('Error generating ICS for RSVP:', error);
                throw new Error('Failed to generate calendar file');
            }
        });
    }
    /**
     * Generate ICS content from calendar data
     */
    static generateICSContent(data) {
        const now = new Date();
        const timestamp = CalendarService.formatDateForICS(now);
        // Format dates for ICS
        const startDateTime = CalendarService.formatDateForICS(data.startDate);
        const endDateTime = CalendarService.formatDateForICS(data.endDate);
        // Escape special characters for ICS format
        const escapeICSText = (text) => {
            return text
                .replace(/\\/g, '\\\\')
                .replace(/;/g, '\\;')
                .replace(/,/g, '\\,')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '');
        };
        // Fold long lines (ICS spec requires lines to be max 75 characters)
        const foldLine = (line) => {
            if (line.length <= 75)
                return line;
            const folded = [];
            let remaining = line;
            while (remaining.length > 75) {
                folded.push(remaining.substring(0, 75));
                remaining = ' ' + remaining.substring(75);
            }
            if (remaining.length > 0) {
                folded.push(remaining);
            }
            return folded.join('\r\n');
        };
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//SI3//RSVP System//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:REQUEST',
            'BEGIN:VEVENT',
            `UID:${data.uid}`,
            `DTSTAMP:${timestamp}`,
            `DTSTART:${startDateTime}`,
            `DTEND:${endDateTime}`,
            foldLine(`SUMMARY:${escapeICSText(data.title)}`),
            foldLine(`DESCRIPTION:${escapeICSText(data.description)}`),
            foldLine(`LOCATION:${escapeICSText(data.location)}`),
            `ORGANIZER;CN=${data.organizer.name}:mailto:${data.organizer.email}`,
            `ATTENDEE;CN=${data.attendee.name}:mailto:${data.attendee.email}`,
            'STATUS:CONFIRMED',
            'SEQUENCE:0',
            'CLASS:PUBLIC',
            'TRANSP:OPAQUE',
            ...(data.url ? [foldLine(`URL:${data.url}`)] : []),
            'BEGIN:VALARM',
            'TRIGGER:-PT1H',
            'ACTION:DISPLAY',
            foldLine(`DESCRIPTION:Reminder: ${escapeICSText(data.title)} starts in 1 hour`),
            'END:VALARM',
            'BEGIN:VALARM',
            'TRIGGER:-PT24H',
            'ACTION:DISPLAY',
            foldLine(`DESCRIPTION:Reminder: ${escapeICSText(data.title)} is tomorrow`),
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');
        return icsContent;
    }
    /**
     * Format date for ICS format (YYYYMMDDTHHMMSSZ)
     */
    static formatDateForICS(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    }
    /**
     * Calculate end date if not provided (default to 2 hours after start)
     */
    static calculateEndDate(startDate) {
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 2);
        return endDate;
    }
    /**
     * Format event description for calendar
     */
    static formatEventDescription(event, rsvp) {
        let description = event.description || '';
        // Add RSVP details
        description += `\n\nRSVP Details:`;
        description += `\nStatus: ${rsvp.status}`;
        description += `\nGuests: ${rsvp.guestCount} people`;
        if (rsvp.dietaryRestrictions) {
            description += `\nDietary Restrictions: ${rsvp.dietaryRestrictions}`;
        }
        if (rsvp.specialRequests) {
            description += `\nSpecial Requests: ${rsvp.specialRequests}`;
        }
        // Add organizer contact info
        description += `\n\nOrganizer: ${event.organizer.name}`;
        description += `\nContact: ${event.organizer.email}`;
        if (event.organizer.phone) {
            description += `\nPhone: ${event.organizer.phone}`;
        }
        // Add access instructions if available
        if (event.location.accessInstructions) {
            description += `\n\nAccess Instructions:\n${event.location.accessInstructions}`;
        }
        return description;
    }
    /**
     * Format location for calendar
     */
    static formatLocation(location) {
        let locationStr = location.venue || '';
        if (location.type === 'virtual' && location.virtualLink) {
            locationStr += ` (Virtual: ${location.virtualLink})`;
        }
        else if (location.address) {
            locationStr += `, ${location.address}`;
        }
        return locationStr;
    }
    /**
     * Generate calendar filename
     */
    static generateCalendarFilename(eventTitle, rsvpId) {
        // Sanitize event title for filename
        const sanitizedTitle = eventTitle
            .replace(/[^a-z0-9]/gi, '_')
            .toLowerCase()
            .substring(0, 50);
        return `${sanitizedTitle}_${rsvpId}.ics`;
    }
    /**
     * Generate Google Calendar URL
     */
    static generateGoogleCalendarURL(rsvpId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check cache first
                const cacheKey = `calendar_google_${rsvpId}`;
                const cachedURL = yield redisHelper_1.default.cacheGet(cacheKey);
                if (cachedURL) {
                    return cachedURL;
                }
                // Get RSVP with user data
                const rsvp = yield Promise.resolve().then(() => __importStar(require("../models/rsvpModel"))).then(m => m.default.findById(rsvpId).populate('user', 'email roles'));
                if (!rsvp) {
                    throw new Error('RSVP not found');
                }
                // Get event data from Sanity
                const event = yield sanity_1.SanityEventService.getEventById(rsvp.eventId);
                if (!event) {
                    throw new Error('Event not found');
                }
                const startDate = new Date(event.eventDate);
                const endDate = event.endDate ? new Date(event.endDate) : CalendarService.calculateEndDate(startDate);
                // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
                const formatGoogleDate = (date) => {
                    return CalendarService.formatDateForICS(date);
                };
                const params = new URLSearchParams({
                    action: 'TEMPLATE',
                    text: event.title,
                    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
                    details: CalendarService.formatEventDescription(event, rsvp),
                    location: CalendarService.formatLocation(event.location),
                    sprop: 'website:si3.space'
                });
                const googleURL = `https://calendar.google.com/calendar/render?${params.toString()}`;
                // Cache the Google Calendar URL for 1 hour
                yield redisHelper_1.default.cacheSet(cacheKey, googleURL, 3600);
                return googleURL;
            }
            catch (error) {
                console.error('Error generating Google Calendar URL:', error);
                throw new Error('Failed to generate Google Calendar URL');
            }
        });
    }
    /**
     * Generate Outlook Calendar URL
     */
    static generateOutlookCalendarURL(rsvpId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check cache first
                const cacheKey = `calendar_outlook_${rsvpId}`;
                const cachedURL = yield redisHelper_1.default.cacheGet(cacheKey);
                if (cachedURL) {
                    return cachedURL;
                }
                // Get RSVP with user data
                const rsvp = yield Promise.resolve().then(() => __importStar(require("../models/rsvpModel"))).then(m => m.default.findById(rsvpId).populate('user', 'email roles'));
                if (!rsvp) {
                    throw new Error('RSVP not found');
                }
                // Get event data from Sanity
                const event = yield sanity_1.SanityEventService.getEventById(rsvp.eventId);
                if (!event) {
                    throw new Error('Event not found');
                }
                const startDate = new Date(event.eventDate);
                const endDate = event.endDate ? new Date(event.endDate) : CalendarService.calculateEndDate(startDate);
                const params = new URLSearchParams({
                    path: '/calendar/action/compose',
                    rru: 'addevent',
                    subject: event.title,
                    startdt: startDate.toISOString(),
                    enddt: endDate.toISOString(),
                    body: CalendarService.formatEventDescription(event, rsvp),
                    location: CalendarService.formatLocation(event.location)
                });
                const outlookURL = `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
                // Cache the Outlook Calendar URL for 1 hour
                yield redisHelper_1.default.cacheSet(cacheKey, outlookURL, 3600);
                return outlookURL;
            }
            catch (error) {
                console.error('Error generating Outlook Calendar URL:', error);
                throw new Error('Failed to generate Outlook Calendar URL');
            }
        });
    }
}
exports.CalendarService = CalendarService;
exports.default = CalendarService;
