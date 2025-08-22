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
const usersModel_1 = __importDefault(require("../models/usersModel"));
const rsvpModel_1 = __importDefault(require("../models/rsvpModel"));
dotenv_1.default.config();
function checkSpecificRSVP() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, db_1.connectDB)();
        try {
            const userEmail = 'testwindserf@gmail.com';
            const eventId = 'c92ccc83-738b-414b-be3f-1bd23a0f0b17';
            console.log('🔍 Checking specific RSVP combination...\n');
            console.log(`User Email: ${userEmail}`);
            console.log(`Event ID: ${eventId}\n`);
            // Find the user
            const user = yield usersModel_1.default.findOne({
                email: new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
            });
            if (!user) {
                console.log('❌ User not found');
                return;
            }
            console.log(`✅ User found: ${user._id}\n`);
            // Check for existing RSVP using multiple methods
            console.log('🔍 Method 1: Direct query with exact values');
            const method1 = yield rsvpModel_1.default.findOne({
                eventId: eventId,
                userId: user._id
            });
            console.log(`Result:`, method1 ? {
                id: method1._id,
                eventId: method1.eventId,
                userId: method1.userId,
                status: method1.status,
                createdAt: method1.createdAt
            } : 'Not found');
            console.log('\n🔍 Method 2: Query with string conversion');
            const method2 = yield rsvpModel_1.default.findOne({
                eventId: eventId,
                userId: user._id.toString()
            });
            console.log(`Result:`, method2 ? 'Found' : 'Not found');
            console.log('\n🔍 Method 3: All RSVPs for this user');
            const allUserRSVPs = yield rsvpModel_1.default.find({ userId: user._id });
            console.log(`Total RSVPs for user: ${allUserRSVPs.length}`);
            allUserRSVPs.forEach((rsvp, index) => {
                console.log(`  ${index + 1}. Event: ${rsvp.eventId}, Status: ${rsvp.status}, Created: ${rsvp.createdAt}`);
            });
            console.log('\n🔍 Method 4: All RSVPs for this event');
            const allEventRSVPs = yield rsvpModel_1.default.find({ eventId: eventId });
            console.log(`Total RSVPs for event: ${allEventRSVPs.length}`);
            allEventRSVPs.forEach((rsvp, index) => {
                console.log(`  ${index + 1}. User: ${rsvp.userId}, Status: ${rsvp.status}, Created: ${rsvp.createdAt}`);
            });
            console.log('\n🔍 Method 5: Check for any similar event IDs');
            const similarEvents = yield rsvpModel_1.default.find({
                userId: user._id,
                eventId: { $regex: eventId.substring(0, 8), $options: 'i' }
            });
            console.log(`RSVPs with similar event IDs: ${similarEvents.length}`);
            similarEvents.forEach((rsvp, index) => {
                console.log(`  ${index + 1}. Event: ${rsvp.eventId}, Status: ${rsvp.status}`);
            });
            console.log('\n🔍 Method 6: Raw MongoDB query');
            const db = rsvpModel_1.default.db;
            const collection = db.collection('si3RSVPs');
            const rawResult = yield collection.findOne({
                eventId: eventId,
                userId: user._id
            });
            console.log(`Raw MongoDB result:`, rawResult ? 'Found' : 'Not found');
            if (rawResult) {
                console.log(`Raw document:`, {
                    _id: rawResult._id,
                    eventId: rawResult.eventId,
                    userId: rawResult.userId,
                    status: rawResult.status,
                    createdAt: rawResult.createdAt
                });
            }
            // Check indexes
            console.log('\n🔍 Checking collection indexes...');
            const indexes = yield collection.indexes();
            console.log('Indexes:');
            indexes.forEach((index, i) => {
                console.log(`  ${i + 1}. ${JSON.stringify(index.key)} - unique: ${index.unique || false}`);
            });
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
    checkSpecificRSVP();
}
