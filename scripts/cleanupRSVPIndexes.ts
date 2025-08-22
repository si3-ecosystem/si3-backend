import dotenv from 'dotenv';
import { connectDB, closeConnection } from '../config/db';
import RSVPModel from '../models/rsvpModel';

dotenv.config();

async function cleanupRSVPIndexes() {
  await connectDB();
  
  try {
    console.log('🧹 Cleaning up problematic RSVP indexes...\n');
    
    const collection = RSVPModel.collection;
    
    // Get current indexes
    const indexes = await collection.indexes();
    
    // Find and drop problematic unique indexes on nullable fields
    const problematicIndexes = [
      'confirmationToken_1',
      'calendarToken_1'
    ];
    
    for (const indexName of problematicIndexes) {
      const index = indexes.find(idx => idx.name === indexName);
      if (index) {
        console.log(`🗑️  Dropping problematic index: ${indexName}`);
        try {
          await collection.dropIndex(indexName);
          console.log(`✅ Successfully dropped ${indexName}`);
        } catch (error) {
          console.log(`❌ Failed to drop ${indexName}:`, error);
        }
      } else {
        console.log(`✅ Index ${indexName} not found (already removed)`);
      }
    }
    
    console.log('\n🎉 Cleanup completed!');
    console.log('You should now be able to create RSVPs without duplicate key errors.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await closeConnection();
  }
}

if (require.main === module) {
  cleanupRSVPIndexes();
}
