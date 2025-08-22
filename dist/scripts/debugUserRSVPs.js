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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
const usersModel_1 = __importDefault(require("../models/usersModel"));
const rsvpModel_1 = __importDefault(require("../models/rsvpModel"));
dotenv_1.default.config();
function debugUserRSVPs(userEmail, eventId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, db_1.connectDB)();
        try {
            console.log('🔍 RSVP Debug Tool\n');
            // If no email provided, use the test user
            const targetEmail = userEmail || 'testwindserf@gmail.com';
            console.log(`👤 Looking up user: ${targetEmail}`);
            // Find the user
            const user = yield usersModel_1.default.findOne({
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
            const allRSVPs = yield rsvpModel_1.default.find({ userId: user._id }).sort({ createdAt: -1 });
            if (allRSVPs.length === 0) {
                console.log('   No RSVPs found for this user');
            }
            else {
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
                const specificRSVP = yield rsvpModel_1.default.findOne({
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
                }
                else {
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
        }
        catch (error) {
            console.error('❌ Error:', error);
        }
        finally {
            yield (0, db_1.closeConnection)();
        }
    });
}
// Get command line arguments
const args = process.argv.slice(2);
const emailArg = (_a = args.find(arg => arg.startsWith('--email='))) === null || _a === void 0 ? void 0 : _a.split('=')[1];
const eventArg = (_b = args.find(arg => arg.startsWith('--event='))) === null || _b === void 0 ? void 0 : _b.split('=')[1];
if (require.main === module) {
    console.log('🚀 Starting RSVP debug...');
    if (emailArg)
        console.log(`   Email: ${emailArg}`);
    if (eventArg)
        console.log(`   Event: ${eventArg}`);
    console.log('');
    debugUserRSVPs(emailArg, eventArg);
}
exports.default = debugUserRSVPs;
