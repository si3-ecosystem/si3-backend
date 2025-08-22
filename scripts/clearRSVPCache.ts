import dotenv from 'dotenv';
import redisHelper from '../helpers/redisHelper';

dotenv.config();

async function clearRSVPCache() {
  try {
    console.log('🧹 Clearing RSVP cache...\n');
    
    const userId = '689db781ae7877ef81bbfd4e'; // Your user ID
    
    // Clear all possible cache keys for this user
    const cacheKeys = [
      `user_rsvps_${userId}_1_10_all`,
      `user_rsvps_${userId}_1_10_undefined`,
      `user_rsvps_${userId}_1_10_`,
      `user_rsvps_${userId}_1_10_attending`,
      `user_rsvps_${userId}_1_10_not_attending`,
      `user_rsvps_${userId}_1_10_waitlisted`,
    ];
    
    console.log('🗑️  Clearing cache keys:');
    for (const key of cacheKeys) {
      console.log(`   - ${key}`);
      await redisHelper.cacheDelete(key);
    }
    
    console.log('\n✅ Cache cleared successfully!');
    console.log('Now try calling GET /api/rsvp/my-rsvps again');
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
}

if (require.main === module) {
  clearRSVPCache();
}
