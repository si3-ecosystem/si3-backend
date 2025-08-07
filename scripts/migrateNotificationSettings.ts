import dotenv from "dotenv";
import { connectDB } from "../config/db";
import UserModel from "../models/usersModel";

// Load environment variables
dotenv.config();

/**
 * Migration script to add default notification settings to existing users
 */
async function migrateNotificationSettings(): Promise<void> {
  try {
    console.log("🔄 Starting notification settings migration...");

    // Connect to database
    await connectDB();

    // Default notification settings
    const defaultNotificationSettings = {
      emailUpdates: true,
      sessionReminder: true,
      marketingEmails: false,
      weeklyDigest: true,
      eventAnnouncements: true,
    };

    // Find users without notification settings
    const usersWithoutSettings = await UserModel.find({
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
    const updateResult = await UserModel.updateMany(
      {
        $or: [
          { notificationSettings: { $exists: false } },
          { notificationSettings: null },
          { notificationSettings: {} }
        ]
      },
      {
        $set: {
          notificationSettings: defaultNotificationSettings,
          settingsUpdatedAt: new Date(),
        }
      }
    );

    console.log(`✅ Migration completed successfully!`);
    console.log(`📈 Updated ${updateResult.modifiedCount} users`);

    // Verify migration
    const verifyCount = await UserModel.countDocuments({
      "notificationSettings.emailUpdates": { $exists: true }
    });

    console.log(`🔍 Verification: ${verifyCount} users now have notification settings`);

    // Show sample of migrated users
    const sampleUsers = await UserModel.find({
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

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

/**
 * Migration script to migrate legacy wallet addresses to walletInfo
 */
async function migrateWalletInfo(): Promise<void> {
  try {
    console.log("🔄 Starting wallet info migration...");

    // Find users with legacy wallet_address but no walletInfo
    const usersWithLegacyWallet = await UserModel.find({
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

        await UserModel.findByIdAndUpdate(user._id, {
          walletInfo,
          settingsUpdatedAt: new Date(),
        });

        migratedCount++;
      }
    }

    console.log(`✅ Wallet migration completed!`);
    console.log(`📈 Migrated ${migratedCount} wallet addresses`);

  } catch (error) {
    console.error("❌ Wallet migration failed:", error);
    throw error;
  }
}

/**
 * Run all migrations
 */
async function runMigrations(): Promise<void> {
  try {
    console.log("🚀 Starting all migrations...");
    
    await migrateNotificationSettings();
    await migrateWalletInfo();
    
    console.log("🎉 All migrations completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration process failed:", error);
    process.exit(1);
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

export { migrateNotificationSettings, migrateWalletInfo, runMigrations };
