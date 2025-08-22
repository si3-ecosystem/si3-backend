import dotenv from 'dotenv';
import { connectDB, closeConnection } from '../config/db';
import UserModel from '../models/usersModel';
import RSVPModel from '../models/rsvpModel';

dotenv.config();

async function debugUserRSVPs(userEmail?: string, eventId?: string) {
  await connectDB();
  
  try {
    console.log('🔍 RSVP Debug Tool\n');
    
    // If no email provided, use the test user
    const targetEmail = userEmail || 'testwindserf@gmail.com';
    
    console.log(`👤 Looking up user: ${targetEmail}`);
    
    // Find the user
    const user = await UserModel.findOne({ 
      email: new RegExp(`^${targetEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') 
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Verified: ${user.isVerified}`);
    console.log(`   Created: ${user.createdAt}`);
    
    // Get all RSVPs for this user
    console.log('\n📋 All RSVPs for this user:');
    const allRSVPs = await RSVPModel.find({ userId: user._id }).sort({ createdAt: -1 });
    
    if (allRSVPs.length === 0) {
      console.log('   No RSVPs found for this user');
    } else {
      console.log(`   Total RSVPs: ${allRSVPs.length}\n`);
      
      allRSVPs.forEach((rsvp, index) => {
        console.log(`   RSVP ${index + 1}:`);
        console.log(`     ID: ${rsvp._id}`);
        console.log(`     Event ID: ${rsvp.eventId}`);
        console.log(`     Status: ${rsvp.status}`);
        console.log(`     Guest Count: ${rsvp.guestCount}`);
        console.log(`     Created: ${rsvp.createdAt}`);
        console.log(`     Updated: ${rsvp.updatedAt}`);
        console.log('');
      });
    }
    
    // If eventId is provided, check specifically for that event
    if (eventId) {
      console.log(`🎫 Checking for RSVP to specific event: ${eventId}`);
      
      const specificRSVP = await RSVPModel.findOne({ 
        eventId: eventId, 
        userId: user._id 
      });
      
      if (specificRSVP) {
        console.log('❌ FOUND EXISTING RSVP for this event:');
        console.log(`   RSVP ID: ${specificRSVP._id}`);
        console.log(`   Status: ${specificRSVP.status}`);
        console.log(`   Guest Count: ${specificRSVP.guestCount}`);
        console.log(`   Created: ${specificRSVP.createdAt}`);
        console.log(`   This is why you're getting the "already RSVP'd" error!`);
        
        console.log('\n🔧 To fix this, you can:');
        console.log('   1. Update the existing RSVP instead of creating a new one');
        console.log('   2. Delete the existing RSVP if it was created in error');
        console.log(`   3. Use PUT /api/rsvp/${specificRSVP._id} to update it`);
        
      } else {
        console.log('✅ No existing RSVP found for this event');
        console.log('   You should be able to create a new RSVP');
      }
    }
    
    // Show the exact query that would be used
    console.log('\n🔍 Debug Query Information:');
    console.log(`   User ID: ${user._id} (ObjectId)`);
    console.log(`   User ID String: "${user._id.toString()}"`);
    if (eventId) {
      console.log(`   Event ID: "${eventId}"`);
      console.log(`   Query: { eventId: "${eventId}", userId: ObjectId("${user._id}") }`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await closeConnection();
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const emailArg = args.find(arg => arg.startsWith('--email='))?.split('=')[1];
const eventArg = args.find(arg => arg.startsWith('--event='))?.split('=')[1];

if (require.main === module) {
  console.log('🚀 Starting RSVP debug...');
  if (emailArg) console.log(`   Email: ${emailArg}`);
  if (eventArg) console.log(`   Event: ${eventArg}`);
  console.log('');
  
  debugUserRSVPs(emailArg, eventArg);
}

export default debugUserRSVPs;
