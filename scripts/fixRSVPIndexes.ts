import dotenv from 'dotenv';
import { connectDB, closeConnection } from '../config/db';
import RSVPModel from '../models/rsvpModel';

dotenv.config();

async function fixRSVPIndexes() {
  await connectDB();
  
  try {
    console.log('🔧 Fixing RSVP collection indexes...\n');
    
    const collection = RSVPModel.collection;
    
    // Get current indexes
    console.log('📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(index.key)} - unique: ${index.unique || false} - name: ${index.name}`);
    });
    
    // Check if confirmationToken index exists
    const confirmationTokenIndex = indexes.find(index => 
      index.key.confirmationToken !== undefined
    );
    
    if (confirmationTokenIndex) {
      console.log('\n❌ Found problematic confirmationToken index');
      console.log(`   Index name: ${confirmationTokenIndex.name}`);
      console.log(`   This is causing the duplicate key error because multiple RSVPs have null confirmationToken`);
      
      console.log('\n🗑️  Dropping confirmationToken index...');
      try {
        await collection.dropIndex(confirmationTokenIndex.name!);
        console.log('✅ Successfully dropped confirmationToken index');
      } catch (error) {
        console.log('❌ Failed to drop index:', error);
      }
    } else {
      console.log('\n✅ No confirmationToken index found');
    }
    
    // Verify the expected indexes exist
    console.log('\n🔍 Checking for required indexes...');
    
    const requiredIndexes = [
      { key: { eventId: 1, userId: 1 }, unique: true, name: 'eventId_1_userId_1' },
      { key: { eventId: 1, status: 1, createdAt: -1 }, unique: false, name: 'eventId_1_status_1_createdAt_-1' },
      { key: { userId: 1, status: 1, createdAt: -1 }, unique: false, name: 'userId_1_status_1_createdAt_-1' }
    ];
    
    for (const requiredIndex of requiredIndexes) {
      const exists = indexes.find(index => 
        JSON.stringify(index.key) === JSON.stringify(requiredIndex.key)
      );
      
      if (exists) {
        console.log(`✅ Index exists: ${JSON.stringify(requiredIndex.key)}`);
      } else {
        console.log(`❌ Missing index: ${JSON.stringify(requiredIndex.key)}`);
        console.log(`   Creating index...`);
        try {
          await collection.createIndex(requiredIndex.key as any, {
            unique: requiredIndex.unique,
            name: requiredIndex.name
          });
          console.log(`✅ Created index: ${requiredIndex.name}`);
        } catch (error) {
          console.log(`❌ Failed to create index: ${error}`);
        }
      }
    }
    
    // Final index check
    console.log('\n📋 Final indexes after cleanup:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(index.key)} - unique: ${index.unique || false} - name: ${index.name}`);
    });
    
    console.log('\n🎉 Index cleanup completed!');
    console.log('You should now be able to create RSVPs without the duplicate key error.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await closeConnection();
  }
}

if (require.main === module) {
  fixRSVPIndexes();
}
