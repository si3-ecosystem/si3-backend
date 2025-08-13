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
exports.fixUsernameCase = fixUsernameCase;
exports.capitalizeAllUsernames = capitalizeAllUsernames;
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
const usersModel_1 = __importDefault(require("../models/usersModel"));
// Load environment variables
dotenv_1.default.config();
/**
 * Migration script to fix username case for existing users
 * This is needed because the schema previously had lowercase: true
 */
function fixUsernameCase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🔄 Starting username case fix migration...");
            // Connect to database
            yield (0, db_1.connectDB)();
            // Find users with lowercase usernames that need fixing
            const usersToFix = yield usersModel_1.default.find({
                username: { $exists: true, $ne: null }
            }).select('username email');
            console.log(`📊 Found ${usersToFix.length} users with usernames`);
            if (usersToFix.length === 0) {
                console.log("✅ No users found with usernames");
                process.exit(0);
            }
            // Manual mapping for known users (you can extend this)
            const usernameFixes = {
                "asraful": "Asraful",
                // Add more mappings as needed
                // "john": "John",
                // "jane": "Jane",
            };
            let fixedCount = 0;
            for (const user of usersToFix) {
                const currentUsername = user.username;
                if (!currentUsername) {
                    console.log(`ℹ️  Skipping user ${user.email} - no username`);
                    continue;
                }
                const properCaseUsername = usernameFixes[currentUsername];
                if (properCaseUsername && properCaseUsername !== currentUsername) {
                    console.log(`🔧 Fixing username: ${currentUsername} → ${properCaseUsername} (${user.email})`);
                    // Update the username with proper case
                    yield usersModel_1.default.findByIdAndUpdate(user._id, {
                        username: properCaseUsername,
                        settingsUpdatedAt: new Date(),
                    });
                    fixedCount++;
                }
                else {
                    console.log(`ℹ️  Skipping ${currentUsername} (${user.email}) - no fix needed or mapping not found`);
                }
            }
            console.log(`✅ Username case fix completed!`);
            console.log(`📈 Fixed ${fixedCount} usernames`);
            // Verify the fix for the specific user
            const verifyUser = yield usersModel_1.default.findOne({ email: 'asraful.islam@tutors.es' });
            if (verifyUser) {
                console.log(`🔍 Verification - User ${verifyUser.email} now has username: "${verifyUser.username}"`);
            }
            process.exit(0);
        }
        catch (error) {
            console.error("❌ Username case fix failed:", error);
            process.exit(1);
        }
    });
}
/**
 * Alternative approach: Capitalize first letter of all usernames
 */
function capitalizeAllUsernames() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🔄 Starting automatic username capitalization...");
            // Connect to database
            yield (0, db_1.connectDB)();
            // Find users with lowercase usernames
            const usersToFix = yield usersModel_1.default.find({
                username: { $exists: true, $ne: null, $regex: /^[a-z]/ }
            }).select('username email');
            console.log(`📊 Found ${usersToFix.length} users with lowercase usernames`);
            let fixedCount = 0;
            for (const user of usersToFix) {
                const currentUsername = user.username;
                if (!currentUsername) {
                    console.log(`ℹ️  Skipping user ${user.email} - no username`);
                    continue;
                }
                // Capitalize first letter, keep rest as is
                const capitalizedUsername = currentUsername.charAt(0).toUpperCase() + currentUsername.slice(1);
                if (capitalizedUsername !== currentUsername) {
                    console.log(`🔧 Capitalizing: ${currentUsername} → ${capitalizedUsername} (${user.email})`);
                    yield usersModel_1.default.findByIdAndUpdate(user._id, {
                        username: capitalizedUsername,
                        settingsUpdatedAt: new Date(),
                    });
                    fixedCount++;
                }
            }
            console.log(`✅ Username capitalization completed!`);
            console.log(`📈 Capitalized ${fixedCount} usernames`);
            process.exit(0);
        }
        catch (error) {
            console.error("❌ Username capitalization failed:", error);
            process.exit(1);
        }
    });
}
// Run the specific fix for known usernames
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.includes('--capitalize-all')) {
        capitalizeAllUsernames();
    }
    else {
        fixUsernameCase();
    }
}
