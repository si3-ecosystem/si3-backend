import { IRSVP } from "../models/rsvpModel";
import { IUser } from "../models/usersModel";
import { SanityEventService } from "../config/sanity";
import redisHelper from "../helpers/redisHelper";

// Type for RSVP with populated user
interface PopulatedRSVP extends IRSVP {
  user: IUser;
}

// Interface for calendar event data
interface CalendarEventData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  organizer: {
    name: string;
    email: string;
  };
  attendee: {
    name: string;
    email: string;
  };
  uid: string;
  url?: string;
}

export class CalendarService {
  /**
   * Generate ICS calendar file content for an RSVP
   */
  static async generateICSForRSVP(rsvpId: string): Promise<string> {
    try {
      // Check cache first
      const cacheKey = `calendar_ics_${rsvpId}`;
      const cachedICS = await redisHelper.cacheGet<string>(cacheKey);

      if (cachedICS) {
        return cachedICS;
      }

      // Get RSVP with user data
      const rsvp = await import("../models/rsvpModel").then(m =>
        m.default.findById(rsvpId).populate('user', 'email roles')
      ) as PopulatedRSVP | null;

      if (!rsvp) {
        throw new Error('RSVP not found');
      }

      // Get event data from Sanity
      const event = await SanityEventService.getEventById(rsvp.eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Prepare calendar event data
      const calendarData: CalendarEventData = {
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
      await redisHelper.cacheSet(cacheKey, icsContent, 3600);

      return icsContent;
    } catch (error) {
      console.error('Error generating ICS for RSVP:', error);
      throw new Error('Failed to generate calendar file');
    }
  }

  /**
   * Generate ICS content from calendar data
   */
  private static generateICSContent(data: CalendarEventData): string {
    const now = new Date();
    const timestamp = CalendarService.formatDateForICS(now);

    // Format dates for ICS
    const startDateTime = CalendarService.formatDateForICS(data.startDate);
    const endDateTime = CalendarService.formatDateForICS(data.endDate);

    // Escape special characters for ICS format
    const escapeICSText = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
    };

    // Fold long lines (ICS spec requires lines to be max 75 characters)
    const foldLine = (line: string): string => {
      if (line.length <= 75) return line;

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
  private static formatDateForICS(date: Date): string {
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
  private static calculateEndDate(startDate: Date): Date {
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2);
    return endDate;
  }

  /**
   * Format event description for calendar
   */
  private static formatEventDescription(event: any, rsvp: any): string {
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
  private static formatLocation(location: any): string {
    let locationStr = location.venue || '';

    if (location.type === 'virtual' && location.virtualLink) {
      locationStr += ` (Virtual: ${location.virtualLink})`;
    } else if (location.address) {
      locationStr += `, ${location.address}`;
    }

    return locationStr;
  }

  /**
   * Generate calendar filename
   */
  static generateCalendarFilename(eventTitle: string, rsvpId: string): string {
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
  static async generateGoogleCalendarURL(rsvpId: string): Promise<string> {
    try {
      // Check cache first
      const cacheKey = `calendar_google_${rsvpId}`;
      const cachedURL = await redisHelper.cacheGet<string>(cacheKey);

      if (cachedURL) {
        return cachedURL;
      }

      // Get RSVP with user data
      const rsvp = await import("../models/rsvpModel").then(m =>
        m.default.findById(rsvpId).populate('user', 'email roles')
      ) as PopulatedRSVP | null;

      if (!rsvp) {
        throw new Error('RSVP not found');
      }

      // Get event data from Sanity
      const event = await SanityEventService.getEventById(rsvp.eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const startDate = new Date(event.eventDate);
      const endDate = event.endDate ? new Date(event.endDate) : CalendarService.calculateEndDate(startDate);

      // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
      const formatGoogleDate = (date: Date): string => {
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
      await redisHelper.cacheSet(cacheKey, googleURL, 3600);

      return googleURL;
    } catch (error) {
      console.error('Error generating Google Calendar URL:', error);
      throw new Error('Failed to generate Google Calendar URL');
    }
  }

  /**
   * Generate Outlook Calendar URL
   */
  static async generateOutlookCalendarURL(rsvpId: string): Promise<string> {
    try {
      // Check cache first
      const cacheKey = `calendar_outlook_${rsvpId}`;
      const cachedURL = await redisHelper.cacheGet<string>(cacheKey);

      if (cachedURL) {
        return cachedURL;
      }

      // Get RSVP with user data
      const rsvp = await import("../models/rsvpModel").then(m =>
        m.default.findById(rsvpId).populate('user', 'email roles')
      ) as PopulatedRSVP | null;

      if (!rsvp) {
        throw new Error('RSVP not found');
      }

      // Get event data from Sanity
      const event = await SanityEventService.getEventById(rsvp.eventId);
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
      await redisHelper.cacheSet(cacheKey, outlookURL, 3600);

      return outlookURL;
    } catch (error) {
      console.error('Error generating Outlook Calendar URL:', error);
      throw new Error('Failed to generate Outlook Calendar URL');
    }
  }
}

export default CalendarService;