// Note: Install node-cron with: npm install node-cron @types/node-cron
// import cron from 'node-cron';
import { notificationService } from './notificationService';
import { EventCacheModel } from '../models/rsvpModels';

// Placeholder interface for cron task
interface ScheduledTask {
  start(): void;
  stop(): void;
  running: boolean;
}

class CronService {
  private jobs: Map<string, ScheduledTask> = new Map();

  /**
   * Initialize all cron jobs
   */
  init(): void {
    // For now, just use setInterval as a placeholder
    // Replace with proper cron jobs when node-cron is installed
    this.scheduleNotificationProcessor();
    this.scheduleEventCleanup();
    this.scheduleHealthCheck();

    console.log('✅ RSVP Cron jobs initialized (using setInterval placeholder)');
  }

  /**
   * Process pending notifications every 5 minutes
   */
  private scheduleNotificationProcessor(): void {
    const intervalId = setInterval(async () => {
      try {
        console.log('🔔 Processing pending notifications...');
        await notificationService.processPendingNotifications(100);

        const stats = await notificationService.getNotificationStats();
        console.log(`📊 Notification stats: ${stats.pending} pending, ${stats.sent} sent, ${stats.failed} failed`);

        if (stats.overdue > 0) {
          console.warn(`⚠️ ${stats.overdue} overdue notifications found`);
        }
      } catch (error) {
        console.error('❌ Error processing notifications:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    const task: ScheduledTask = {
      start: () => {},
      stop: () => clearInterval(intervalId),
      running: true,
    };

    this.jobs.set('notificationProcessor', task);
    console.log('📅 Notification processor scheduled (every 5 minutes)');
  }

  /**
   * Clean up expired events daily (placeholder: every 24 hours)
   */
  private scheduleEventCleanup(): void {
    const intervalId = setInterval(async () => {
      try {
        console.log('🧹 Cleaning up expired events...');
        const deletedCount = await EventCacheModel.cleanupExpiredEvents();
        console.log(`🗑️ Cleaned up ${deletedCount} expired events`);
      } catch (error) {
        console.error('❌ Error cleaning up events:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    const task: ScheduledTask = {
      start: () => {},
      stop: () => clearInterval(intervalId),
      running: true,
    };

    this.jobs.set('eventCleanup', task);
    console.log('📅 Event cleanup scheduled (every 24 hours)');
  }

  /**
   * Health check every hour
   */
  private scheduleHealthCheck(): void {
    const intervalId = setInterval(async () => {
      try {
        const stats = await notificationService.getNotificationStats();

        // Log health metrics
        console.log('💓 RSVP System Health Check:', {
          timestamp: new Date().toISOString(),
          notifications: stats,
          uptime: process.uptime(),
        });

        // Alert if too many failed notifications
        if (stats.failed > 100) {
          console.error(`🚨 High failure rate: ${stats.failed} failed notifications`);
        }

        // Alert if too many overdue notifications
        if (stats.overdue > 50) {
          console.error(`🚨 Many overdue notifications: ${stats.overdue} overdue`);
        }
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    const task: ScheduledTask = {
      start: () => {},
      stop: () => clearInterval(intervalId),
      running: true,
    };

    this.jobs.set('healthCheck', task);
    console.log('📅 Health check scheduled (hourly)');
  }

  /**
   * Stop all cron jobs
   */
  stopAll(): void {
    this.jobs.forEach((task, name) => {
      task.stop();
      console.log(`⏹️ Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Stop specific cron job
   */
  stop(jobName: string): void {
    const task = this.jobs.get(jobName);
    if (task) {
      task.stop();
      this.jobs.delete(jobName);
      console.log(`⏹️ Stopped cron job: ${jobName}`);
    }
  }

  /**
   * Get status of all jobs
   */
  getStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.jobs.forEach((task, name) => {
      status[name] = task.running;
    });
    return status;
  }

  /**
   * Manually trigger notification processing
   */
  async triggerNotificationProcessing(): Promise<void> {
    console.log('🔔 Manually triggering notification processing...');
    await notificationService.processPendingNotifications(100);
  }

  /**
   * Manually trigger event cleanup
   */
  async triggerEventCleanup(): Promise<void> {
    console.log('🧹 Manually triggering event cleanup...');
    const deletedCount = await EventCacheModel.cleanupExpiredEvents();
    console.log(`🗑️ Cleaned up ${deletedCount} expired events`);
  }
}

export const cronService = new CronService();
export default cronService;
