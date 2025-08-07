import dotenv from "dotenv";
import { connectDB } from "../config/db";
import UserModel from "../models/usersModel";

// Load environment variables
dotenv.config();

/**
 * Migration script to fix username case for existing users
 * This is needed because the schema previously had lowercase: true
 */
async function fixUsernameCase(): Promise<void> {
  try {
    console.log("🔄 Starting username case fix migration...");

    // Connect to database
    await connectDB();

    // Find users with lowercase usernames that need fixing
    const usersToFix = await UserModel.find({
      username: { $exists: true, $ne: null }
    }).select('username email');

    console.log(`📊 Found ${usersToFix.length} users with usernames`);

    if (usersToFix.length === 0) {
      console.log("✅ No users found with usernames");
      process.exit(0);
    }

    // Manual mapping for known users (you can extend this)
    const usernameFixes: { [key: string]: string } = {
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
        await UserModel.findByIdAndUpdate(user._id, {
          username: properCaseUsername,
          settingsUpdatedAt: new Date(),
        });

        fixedCount++;
      } else {
        console.log(`ℹ️  Skipping ${currentUsername} (${user.email}) - no fix needed or mapping not found`);
      }
    }

    console.log(`✅ Username case fix completed!`);
    console.log(`📈 Fixed ${fixedCount} usernames`);

    // Verify the fix for the specific user
    const verifyUser = await UserModel.findOne({ email: 'asraful.islam@tutors.es' });
    if (verifyUser) {
      console.log(`🔍 Verification - User ${verifyUser.email} now has username: "${verifyUser.username}"`);
    }

    process.exit(0);

  } catch (error) {
    console.error("❌ Username case fix failed:", error);
    process.exit(1);
  }
}

/**
 * Alternative approach: Capitalize first letter of all usernames
 */
async function capitalizeAllUsernames(): Promise<void> {
  try {
    console.log("🔄 Starting automatic username capitalization...");

    // Connect to database
    await connectDB();

    // Find users with lowercase usernames
    const usersToFix = await UserModel.find({
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

        await UserModel.findByIdAndUpdate(user._id, {
          username: capitalizedUsername,
          settingsUpdatedAt: new Date(),
        });

        fixedCount++;
      }
    }

    console.log(`✅ Username capitalization completed!`);
    console.log(`📈 Capitalized ${fixedCount} usernames`);

    process.exit(0);

  } catch (error) {
    console.error("❌ Username capitalization failed:", error);
    process.exit(1);
  }
}

// Run the specific fix for known usernames
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--capitalize-all')) {
    capitalizeAllUsernames();
  } else {
    fixUsernameCase();
  }
}

export { fixUsernameCase, capitalizeAllUsernames };
