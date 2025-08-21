"use strict";
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
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
const rsvpModel_1 = __importDefault(require("../models/rsvpModel"));
dotenv_1.default.config();
function fixRSVPIndexes() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, db_1.connectDB)();
        try {
            console.log('🔧 Fixing RSVP collection indexes...\n');
            const collection = rsvpModel_1.default.collection;
            // Get current indexes
            console.log('📋 Current indexes:');
            const indexes = yield collection.indexes();
            indexes.forEach((index, i) => {
                console.log(`  ${i + 1}. ${JSON.stringify(index.key)} - unique: ${index.unique || false} - name: ${index.name}`);
            });
            // Check if confirmationToken index exists
            const confirmationTokenIndex = indexes.find(index => index.key.confirmationToken !== undefined);
            if (confirmationTokenIndex) {
                console.log('\n❌ Found problematic confirmationToken index');
                console.log(`   Index name: ${confirmationTokenIndex.name}`);
                console.log(`   This is causing the duplicate key error because multiple RSVPs have null confirmationToken`);
                console.log('\n🗑️  Dropping confirmationToken index...');
                try {
                    yield collection.dropIndex(confirmationTokenIndex.name);
                    console.log('✅ Successfully dropped confirmationToken index');
                }
                catch (error) {
                    console.log('❌ Failed to drop index:', error);
                }
            }
            else {
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
                const exists = indexes.find(index => JSON.stringify(index.key) === JSON.stringify(requiredIndex.key));
                if (exists) {
                    console.log(`✅ Index exists: ${JSON.stringify(requiredIndex.key)}`);
                }
                else {
                    console.log(`❌ Missing index: ${JSON.stringify(requiredIndex.key)}`);
                    console.log(`   Creating index...`);
                    try {
                        yield collection.createIndex(requiredIndex.key, {
                            unique: requiredIndex.unique,
                            name: requiredIndex.name
                        });
                        console.log(`✅ Created index: ${requiredIndex.name}`);
                    }
                    catch (error) {
                        console.log(`❌ Failed to create index: ${error}`);
                    }
                }
            }
            // Final index check
            console.log('\n📋 Final indexes after cleanup:');
            const finalIndexes = yield collection.indexes();
            finalIndexes.forEach((index, i) => {
                console.log(`  ${i + 1}. ${JSON.stringify(index.key)} - unique: ${index.unique || false} - name: ${index.name}`);
            });
            console.log('\n🎉 Index cleanup completed!');
            console.log('You should now be able to create RSVPs without the duplicate key error.');
        }
        catch (error) {
            console.error('❌ Error:', error);
        }
        finally {
            yield (0, db_1.closeConnection)();
        }
    });
}
if (require.main === module) {
    fixRSVPIndexes();
}
