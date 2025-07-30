import { EventCacheModel, EventType } from '../models/rsvpModels';
import redisClient from '../config/redis';

export interface SanityEventData {
  _id: string;
  title: string;
  description?: string;
  eventType: EventType;
  startDate: string;
  endDate?: string;
  location?: string;
  maxAttendees?: number;
  isActive?: boolean;
  slug?: {
    current: string;
  };
  // Add other Sanity-specific fields as needed
}

class SanityIntegrationService {
  /**
   * Process Sanity webhook for event updates
   */
  async processEventWebhook(eventData: SanityEventData): Promise<void> {
    try {
      const eventId = eventData._id;
      
      // Validate required fields
      if (!eventData.title || !eventData.startDate || !eventData.eventType) {
        throw new Error('Missing required event fields: title, startDate, and eventType are required');
      }

      // Validate event type
      if (!Object.values(EventType).includes(eventData.eventType)) {
        throw new Error(`Invalid event type: ${eventData.eventType}`);
      }

      // Validate dates
      const startDate = new Date(eventData.startDate);
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid start date format');
      }

      let endDate: Date | undefined;
      if (eventData.endDate) {
        endDate = new Date(eventData.endDate);
        if (isNaN(endDate.getTime())) {
          throw new Error('Invalid end date format');
        }
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }

      // Sync event to cache
      await EventCacheModel.syncFromSanity(eventId, {
        ...eventData,
        startDate: startDate.toISOString(),
        endDate: endDate?.toISOString(),
        isActive: eventData.isActive !== false, // Default to true if not specified
      });

      // Clear related caches
      await this.clearEventCaches(eventId);

      console.log(`✅ Successfully synced event ${eventId} from Sanity`);
    } catch (error) {
      console.error('❌ Error processing Sanity event webhook:', error);
      throw error;
    }
  }

  /**
   * Process event deletion from Sanity
   */
  async processEventDeletion(eventId: string): Promise<void> {
    try {
      // Mark event as inactive instead of deleting to preserve RSVP history
      await EventCacheModel.findOneAndUpdate(
        { eventId },
        { 
          isActive: false,
          lastSyncedAt: new Date(),
        }
      );

      // Clear related caches
      await this.clearEventCaches(eventId);

      console.log(`✅ Successfully marked event ${eventId} as inactive`);
    } catch (error) {
      console.error('❌ Error processing Sanity event deletion:', error);
      throw error;
    }
  }

  /**
   * Bulk sync events from Sanity
   */
  async bulkSyncEvents(events: SanityEventData[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const eventData of events) {
      try {
        await this.processEventWebhook(eventData);
        success++;
      } catch (error) {
        failed++;
        errors.push(`Event ${eventData._id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`📊 Bulk sync completed: ${success} success, ${failed} failed`);
    return { success, failed, errors };
  }

  /**
   * Get events that need syncing (haven't been synced recently)
   */
  async getStaleEvents(hoursThreshold: number = 24): Promise<any[]> {
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - hoursThreshold);

    return EventCacheModel.find({
      $or: [
        { lastSyncedAt: { $lt: threshold } },
        { lastSyncedAt: { $exists: false } }
      ],
      isActive: true,
    }).select('eventId title lastSyncedAt');
  }

  /**
   * Validate Sanity webhook signature (implement based on your Sanity setup)
   */
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Implement webhook signature validation based on Sanity's documentation
    // This is a placeholder implementation
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }

  /**
   * Clear event-related caches
   */
  private async clearEventCaches(eventId: string): Promise<void> {
    try {
      const pattern = `rsvp:*${eventId}*`;
      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
        console.log(`🗑️ Cleared ${keys.length} cache keys for event ${eventId}`);
      }
    } catch (error) {
      console.error('❌ Error clearing event caches:', error);
    }
  }

  /**
   * Get event sync statistics
   */
  async getSyncStats(): Promise<{
    totalEvents: number;
    activeEvents: number;
    inactiveEvents: number;
    recentlySynced: number;
    staleEvents: number;
  }> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const [
      totalEvents,
      activeEvents,
      inactiveEvents,
      recentlySynced,
      staleEvents,
    ] = await Promise.all([
      EventCacheModel.countDocuments(),
      EventCacheModel.countDocuments({ isActive: true }),
      EventCacheModel.countDocuments({ isActive: false }),
      EventCacheModel.countDocuments({ lastSyncedAt: { $gte: oneDayAgo } }),
      EventCacheModel.countDocuments({ 
        lastSyncedAt: { $lt: oneDayAgo },
        isActive: true,
      }),
    ]);

    return {
      totalEvents,
      activeEvents,
      inactiveEvents,
      recentlySynced,
      staleEvents,
    };
  }

  /**
   * Transform Sanity event data to internal format
   */
  transformSanityEvent(sanityEvent: any): SanityEventData {
    return {
      _id: sanityEvent._id,
      title: sanityEvent.title,
      description: sanityEvent.description,
      eventType: sanityEvent.eventType,
      startDate: sanityEvent.startDate,
      endDate: sanityEvent.endDate,
      location: sanityEvent.location,
      maxAttendees: sanityEvent.maxAttendees,
      isActive: sanityEvent.isActive,
      slug: sanityEvent.slug,
    };
  }

  /**
   * Health check for Sanity integration
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    message: string;
    stats: any;
  }> {
    try {
      const stats = await this.getSyncStats();
      
      if (stats.staleEvents > 10) {
        return {
          status: 'warning',
          message: `${stats.staleEvents} events haven't been synced recently`,
          stats,
        };
      }

      return {
        status: 'healthy',
        message: 'Sanity integration is healthy',
        stats,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stats: null,
      };
    }
  }
}

export const sanityIntegrationService = new SanityIntegrationService();
export default sanityIntegrationService;
