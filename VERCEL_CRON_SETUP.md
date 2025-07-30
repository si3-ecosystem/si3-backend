# Vercel Cron Jobs Setup Guide

## Overview

Vercel doesn't support traditional long-running processes or `setInterval` for cron jobs. Instead, you have several options for handling scheduled tasks.

## ❌ What Doesn't Work on Vercel

```javascript
// This WON'T work on Vercel
setInterval(() => {
  // Process notifications
}, 5 * 60 * 1000);

// This also WON'T work on Vercel
import cron from 'node-cron';
cron.schedule('*/5 * * * *', () => {
  // Process notifications
});
```

**Why?** Vercel functions are stateless and have execution time limits (10 seconds for Hobby, 15 minutes for Pro).

## ✅ Vercel Solutions

### Option 1: Vercel Cron Jobs (Recommended)

Vercel provides built-in cron job support using `vercel.json` configuration.

#### 1. Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-notifications",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/cleanup-events", 
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/health-check",
      "schedule": "0 * * * *"
    }
  ]
}
```

#### 2. Create Cron API Routes:

**`api/cron/process-notifications.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '../../../services/notificationService';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔔 Processing pending notifications...');
    await notificationService.processPendingNotifications(100);

    const stats = await notificationService.getNotificationStats();
    console.log(`📊 Notification stats: ${stats.pending} pending, ${stats.sent} sent, ${stats.failed} failed`);

    return NextResponse.json({ 
      success: true, 
      message: 'Notifications processed',
      stats 
    });
  } catch (error) {
    console.error('❌ Error processing notifications:', error);
    return NextResponse.json({ 
      error: 'Failed to process notifications' 
    }, { status: 500 });
  }
}
```

**`api/cron/cleanup-events.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { EventCacheModel } from '../../../models/rsvpModels';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧹 Cleaning up expired events...');
    const deletedCount = await EventCacheModel.cleanupExpiredEvents();
    console.log(`🗑️ Cleaned up ${deletedCount} expired events`);

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${deletedCount} expired events`,
      deletedCount 
    });
  } catch (error) {
    console.error('❌ Error cleaning up events:', error);
    return NextResponse.json({ 
      error: 'Failed to cleanup events' 
    }, { status: 500 });
  }
}
```

**`api/cron/health-check.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '../../../services/notificationService';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await notificationService.getNotificationStats();

    console.log('💓 RSVP System Health Check:', {
      timestamp: new Date().toISOString(),
      notifications: stats,
    });

    const alerts = [];
    if (stats.failed > 100) {
      alerts.push(`High failure rate: ${stats.failed} failed notifications`);
    }
    if (stats.overdue > 50) {
      alerts.push(`Many overdue notifications: ${stats.overdue} overdue`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Health check completed',
      stats,
      alerts
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return NextResponse.json({ 
      error: 'Health check failed' 
    }, { status: 500 });
  }
}
```

#### 3. Add Environment Variable:
```env
CRON_SECRET=your-super-secret-cron-key
```

#### 4. Update Your Current Code:

**Modify `services/cronService.ts`:**
```typescript
class CronService {
  init(): void {
    if (process.env.VERCEL) {
      console.log('✅ Running on Vercel - Cron jobs handled by vercel.json');
      return;
    }
    
    // Keep existing setInterval code for local development
    this.scheduleNotificationProcessor();
    this.scheduleEventCleanup();
    this.scheduleHealthCheck();
    console.log('✅ RSVP Cron jobs initialized (using setInterval for local dev)');
  }
  
  // Keep existing methods for manual triggering
}
```

### Option 2: External Cron Services

#### GitHub Actions (Free):
```yaml
# .github/workflows/cron.yml
name: Scheduled Tasks
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
    - cron: '0 0 * * *'    # Daily at midnight
    - cron: '0 * * * *'    # Every hour

jobs:
  process-notifications:
    if: github.event.schedule == '*/5 * * * *'
    runs-on: ubuntu-latest
    steps:
      - name: Process Notifications
        run: |
          curl -X GET "${{ secrets.API_URL }}/api/cron/process-notifications" \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

  cleanup-events:
    if: github.event.schedule == '0 0 * * *'
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup Events
        run: |
          curl -X GET "${{ secrets.API_URL }}/api/cron/cleanup-events" \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### EasyCron (External Service):
1. Sign up at [EasyCron.com](https://www.easycron.com)
2. Create cron jobs that call your API endpoints:
   - URL: `https://your-app.vercel.app/api/cron/process-notifications`
   - Schedule: `*/5 * * * *`
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

### Option 3: Trigger-Based Processing (Alternative Approach)

Instead of scheduled jobs, process notifications when users interact with the system:

```typescript
// In your RSVP controller
export const createOrUpdateRSVP = catchAsync(async (req, res, next) => {
  // ... existing RSVP logic ...

  // Trigger notification processing after RSVP
  try {
    await notificationService.processPendingNotifications(10);
  } catch (error) {
    console.warn('Failed to process notifications:', error);
    // Don't fail the RSVP if notification processing fails
  }

  res.status(200).json({ /* response */ });
});
```

## 🎯 Recommended Approach

**For Production:** Use **Vercel Cron Jobs** (Option 1)
- Native Vercel integration
- Reliable and scalable
- Easy to monitor via Vercel dashboard

**For Development:** Keep your current `setInterval` approach
- Works fine for local testing
- No external dependencies

## Migration Steps

1. **Create the cron API routes** (shown above)
2. **Add `vercel.json`** with cron configuration
3. **Add `CRON_SECRET`** environment variable
4. **Update `cronService.ts`** to detect Vercel environment
5. **Deploy and test** the cron endpoints manually first
6. **Monitor** Vercel function logs for cron execution

## Testing Your Setup

```bash
# Test cron endpoints manually
curl -X GET "https://your-app.vercel.app/api/cron/process-notifications" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"

curl -X GET "https://your-app.vercel.app/api/cron/cleanup-events" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"

curl -X GET "https://your-app.vercel.app/api/cron/health-check" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Monitoring

- **Vercel Dashboard**: Check function logs and execution times
- **Function Logs**: Monitor cron job execution in Vercel's function logs
- **Error Tracking**: Set up error monitoring (Sentry, LogRocket, etc.)

## Cost Considerations

- **Vercel Hobby**: Limited cron jobs and function executions
- **Vercel Pro**: More generous limits for production apps
- **External Services**: GitHub Actions is free, EasyCron has free tier

## Is It Necessary?

**Yes, for production** - Notifications need to be sent reliably and on schedule.

**Alternatives:**
1. **Real-time processing**: Process notifications immediately when RSVPs are created
2. **User-triggered**: Process notifications when users visit the app
3. **Webhook-based**: Use external services to trigger processing

But scheduled processing is the most reliable approach for time-sensitive notifications.
