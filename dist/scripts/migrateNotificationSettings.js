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
exports.migrateNotificationSettings = migrateNotificationSettings;
exports.migrateWalletInfo = migrateWalletInfo;
exports.runMigrations = runMigrations;
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
const usersModel_1 = __importDefault(require("../models/usersModel"));
// Load environment variables
dotenv_1.default.config();
/**
 * Migration script to add default notification settings to existing users
 */
function migrateNotificationSettings() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🔄 Starting notification settings migration...");
            // Connect to database
            yield (0, db_1.connectDB)();
            // Default notification settings
            const defaultNotificationSettings = {
                emailUpdates: true,
                sessionReminder: true,
                marketingEmails: false,
                weeklyDigest: true,
                eventAnnouncements: true,
            };
            // Find users without notification settings
            const usersWithoutSettings = yield usersModel_1.default.find({
                $or: [
                    { notificationSettings: { $exists: false } },
                    { notificationSettings: null },
                    { notificationSettings: {} }
                ]
            });
            console.log(`📊 Found ${usersWithoutSettings.length} users without notification settings`);
            if (usersWithoutSettings.length === 0) {
                console.log("✅ All users already have notification settings");
                process.exit(0);
            }
            // Update users with default notification settings
            const updateResult = yield usersModel_1.default.updateMany({
                $or: [
                    { notificationSettings: { $exists: false } },
                    { notificationSettings: null },
                    { notificationSettings: {} }
                ]
            }, {
                $set: {
                    notificationSettings: defaultNotificationSettings,
                    settingsUpdatedAt: new Date(),
                }
            });
            console.log(`✅ Migration completed successfully!`);
            console.log(`📈 Updated ${updateResult.modifiedCount} users`);
            // Verify migration
            const verifyCount = yield usersModel_1.default.countDocuments({
                "notificationSettings.emailUpdates": { $exists: true }
            });
            console.log(`🔍 Verification: ${verifyCount} users now have notification settings`);
            // Show sample of migrated users
            const sampleUsers = yield usersModel_1.default.find({
                "notificationSettings.emailUpdates": { $exists: true }
            })
                .select('email notificationSettings settingsUpdatedAt')
                .limit(3);
            console.log("📋 Sample migrated users:");
            sampleUsers.forEach((user, index) => {
                console.log(`  ${index + 1}. ${user.email}`);
                console.log(`     Settings: ${JSON.stringify(user.notificationSettings)}`);
                console.log(`     Updated: ${user.settingsUpdatedAt}`);
            });
            process.exit(0);
        }
        catch (error) {
            console.error("❌ Migration failed:", error);
            process.exit(1);
        }
    });
}
/**
 * Migration script to migrate legacy wallet addresses to walletInfo
 */
function migrateWalletInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🔄 Starting wallet info migration...");
            // Find users with legacy wallet_address but no walletInfo
            const usersWithLegacyWallet = yield usersModel_1.default.find({
                wallet_address: { $exists: true, $ne: null },
                $or: [
                    { walletInfo: { $exists: false } },
                    { walletInfo: null },
                    { "walletInfo.address": { $exists: false } }
                ]
            });
            console.log(`📊 Found ${usersWithLegacyWallet.length} users with legacy wallet addresses`);
            if (usersWithLegacyWallet.length === 0) {
                console.log("✅ All users already have migrated wallet info");
                return;
            }
            let migratedCount = 0;
            for (const user of usersWithLegacyWallet) {
                if (user.wallet_address) {
                    const walletInfo = {
                        address: user.wallet_address.toLowerCase(),
                        connectedWallet: "Legacy",
                        network: "Mainnet",
                        connectedAt: user.createdAt,
                        lastUsed: user.lastLogin || user.createdAt,
                    };
                    yield usersModel_1.default.findByIdAndUpdate(user._id, {
                        walletInfo,
                        settingsUpdatedAt: new Date(),
                    });
                    migratedCount++;
                }
            }
            console.log(`✅ Wallet migration completed!`);
            console.log(`📈 Migrated ${migratedCount} wallet addresses`);
        }
        catch (error) {
            console.error("❌ Wallet migration failed:", error);
            throw error;
        }
    });
}
/**
 * Run all migrations
 */
function runMigrations() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🚀 Starting all migrations...");
            yield migrateNotificationSettings();
            yield migrateWalletInfo();
            console.log("🎉 All migrations completed successfully!");
        }
        catch (error) {
            console.error("❌ Migration process failed:", error);
            process.exit(1);
        }
    });
}
// Run migrations if this script is executed directly
if (require.main === module) {
    runMigrations();
}
