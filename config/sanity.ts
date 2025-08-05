import dotenv from "dotenv";
dotenv.config();

import { createClient } from '@sanity/client';

// Sanity client configuration
const sanityConfig = {
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01', // Use current date in YYYY-MM-DD format
  useCdn: process.env.NODE_ENV === 'production', // Use CDN in production
  token: process.env.SANITY_API_TOKEN, // Required for write operations
};

// Validate required environment variables
if (!sanityConfig.projectId) {
  throw new Error('SANITY_PROJECT_ID environment variable is required');
}

if (!sanityConfig.token) {
  console.warn('SANITY_API_TOKEN not provided. Read-only operations only.');
}

// Create Sanity client
export const sanityClient = createClient(sanityConfig);

// Helper functions for common event queries (using guidesSession)
export class SanityEventService {
  /**
   * Get event by ID (using guidesSession)
   */
  static async getEventById(eventId: string) {
    try {
      const event = await sanityClient.fetch(`
        *[_type == "guidesSession" && _id == $eventId][0] {
          _id,
          title,
          description,
          "eventDate": date,
          endDate,
          guideName,
          guideImage,
          language,
          partner->{
            _id,
            name
          },
          videoUrl,
          featured,
          location,
          organizer,
          rsvpSettings,
          emailSettings
        }
      `, { eventId });

      return event;
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      throw new Error('Failed to fetch event');
    }
  }

  /**
   * Get event by slug (using title as identifier for guidesSession)
   */
  static async getEventBySlug(slug: string) {
    try {
      const event = await sanityClient.fetch(`
        *[_type == "guidesSession" && title match $slug][0] {
          _id,
          title,
          description,
          "eventDate": date,
          endDate,
          guideName,
          guideImage,
          language,
          partner->{
            _id,
            name
          },
          videoUrl,
          featured,
          location,
          organizer,
          rsvpSettings,
          emailSettings
        }
      `, { slug });

      return event;
    } catch (error) {
      console.error('Error fetching event by slug:', error);
      throw new Error('Failed to fetch event');
    }
  }

  /**
   * Get upcoming guide sessions with RSVP enabled
   */
  static async getUpcomingEvents(limit: number = 10) {
    try {
      const events = await sanityClient.fetch(`
        *[_type == "guidesSession" &&
          rsvpSettings.enabled == true &&
          date > now()
        ] | order(date asc) [0...$limit] {
          _id,
          title,
          description,
          "eventDate": date,
          endDate,
          guideName,
          guideImage,
          language,
          partner->{
            _id,
            name
          },
          videoUrl,
          featured,
          location,
          organizer,
          rsvpSettings
        }
      `, { limit });

      return events;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw new Error('Failed to fetch upcoming events');
    }
  }

  /**
   * Validate if guide session exists and RSVP is enabled
   */
  static async validateEventForRSVP(eventId: string) {
    try {
      console.log(`🔍 Sanity: Fetching event data for eventId: ${eventId}`);

      const event = await sanityClient.fetch(`
        *[_type == "guidesSession" && _id == $eventId][0] {
          _id,
          title,
          "eventDate": date,
          rsvpSettings {
            enabled,
            rsvpDeadline,
            maxCapacity,
            waitlistEnabled,
            requiresApproval,
            allowGuests,
            maxGuestsPerRSVP
          },
          featured
        }
      `, { eventId });

      console.log(`📊 Sanity: Raw event data received:`, JSON.stringify(event, null, 2));

      if (!event) {
        console.log(`❌ Sanity: Event not found for eventId: ${eventId}`);
        throw new Error('Event not found');
      }

      console.log(`📊 Sanity: Event found - analyzing RSVP settings:`, {
        eventId: event._id,
        title: event.title,
        hasRsvpSettings: !!event.rsvpSettings,
        rsvpEnabled: event.rsvpSettings?.enabled,
        maxGuestsPerRSVP: event.rsvpSettings?.maxGuestsPerRSVP,
        maxGuestsType: typeof event.rsvpSettings?.maxGuestsPerRSVP,
        maxCapacity: event.rsvpSettings?.maxCapacity,
        waitlistEnabled: event.rsvpSettings?.waitlistEnabled,
        requiresApproval: event.rsvpSettings?.requiresApproval
      });

      // Guide sessions don't have isPublished field, so we skip this check
      // You can add a published field to your guidesSession schema if needed

      console.log(`🔍 Sanity: Validating RSVP settings...`);
      if (!event.rsvpSettings?.enabled) {
        console.log(`❌ Sanity: RSVP not enabled for this event`);
        throw new Error('RSVP is not enabled for this event');
      }
      console.log(`✅ Sanity: RSVP is enabled`);

      // Check if RSVP deadline has passed
      if (event.rsvpSettings.rsvpDeadline) {
        const deadline = new Date(event.rsvpSettings.rsvpDeadline);
        const now = new Date();
        console.log(`🔍 Sanity: Checking RSVP deadline:`, {
          deadline: deadline.toISOString(),
          now: now.toISOString(),
          hasDeadlinePassed: deadline < now
        });
        if (deadline < now) {
          console.log(`❌ Sanity: RSVP deadline has passed`);
          throw new Error('RSVP deadline has passed');
        }
        console.log(`✅ Sanity: RSVP deadline not passed`);
      } else {
        console.log(`📊 Sanity: No RSVP deadline set`);
      }

      // Check if session has already occurred
      const eventDate = new Date(event.eventDate);
      const now = new Date();
      console.log(`🔍 Sanity: Checking event date:`, {
        eventDate: eventDate.toISOString(),
        now: now.toISOString(),
        isEventInPast: eventDate < now
      });
      if (eventDate < now) {
        console.log(`❌ Sanity: Cannot RSVP for past sessions`);
        throw new Error('Cannot RSVP for past sessions');
      }
      console.log(`✅ Sanity: Event is in the future`);

      console.log(`✅ Sanity: Event validation completed successfully`);
      return event;
    } catch (error) {
      console.error(`💥 Sanity: Error validating event for RSVP:`, {
        eventId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Get guide sessions requiring reminder emails
   */
  static async getEventsForReminders(reminderType: string) {
    try {
      let timeFilter = '';
      const now = new Date();

      switch (reminderType) {
        case '1_week':
          const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          timeFilter = `date >= "${now.toISOString()}" && date <= "${oneWeekFromNow.toISOString()}"`;
          break;
        case '24_hours':
          const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          timeFilter = `date >= "${now.toISOString()}" && date <= "${twentyFourHoursFromNow.toISOString()}"`;
          break;
        case '1_day':
          const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          timeFilter = `date >= "${now.toISOString()}" && date <= "${oneDayFromNow.toISOString()}"`;
          break;
        case '2_hours':
          const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
          timeFilter = `date >= "${now.toISOString()}" && date <= "${twoHoursFromNow.toISOString()}"`;
          break;
        default:
          throw new Error('Invalid reminder type');
      }

      const events = await sanityClient.fetch(`
        *[_type == "guidesSession" &&
          rsvpSettings.enabled == true &&
          ${timeFilter} &&
          emailSettings.reminderSchedule[].timing match "${reminderType}"
        ] {
          _id,
          title,
          "eventDate": date,
          location,
          organizer,
          emailSettings
        }
      `);

      return events;
    } catch (error) {
      console.error('Error fetching guide sessions for reminders:', error);
      throw new Error('Failed to fetch guide sessions for reminders');
    }
  }
}

export default sanityClient;
