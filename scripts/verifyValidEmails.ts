import dotenv from 'dotenv';
import { connectDB, closeConnection } from '../config/db';
import UserModel from '../models/usersModel';

dotenv.config();

function isValidEmail(email: string): boolean {
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isWalletTempEmail(email: string): boolean {
  return email.includes('@wallet.temp');
}

async function verifyValidEmails(dryRun = false) {
  let verified = 0;
  let alreadyVerified = 0;
  let skippedWalletTemp = 0;
  let skippedInvalid = 0;

  console.log(`🔍 Finding users with valid emails to verify...${dryRun ? ' (dry-run)' : ''}`);

  // Find all users who are not verified and have valid emails (not wallet.temp)
  const users = await UserModel.find({
    isVerified: false,
    email: { $exists: true, $ne: null }
  }).select('email isVerified');

  console.log(`📊 Found ${users.length} unverified users to check`);

  for (const user of users) {
    try {
      // Skip wallet.temp emails
      if (isWalletTempEmail(user.email)) {
        skippedWalletTemp++;
        console.log(`⏭️  Skipping wallet temp: ${user.email}`);
        continue;
      }

      // Skip invalid emails
      if (!isValidEmail(user.email)) {
        skippedInvalid++;
        console.log(`⚠️  Skipping invalid email: ${user.email}`);
        continue;
      }

      if (dryRun) {
        verified++;
        console.log(`✅ Would verify: ${user.email}`);
        continue;
      }

      // Update user to verified
      await UserModel.findByIdAndUpdate(
        user._id,
        { 
          isVerified: true,
          settingsUpdatedAt: new Date()
        }
      );

      verified++;
      console.log(`✅ Verified: ${user.email}`);

    } catch (error) {
      console.error(`❌ Error processing ${user.email}:`, error);
    }
  }

  // Count already verified users with valid emails
  const alreadyVerifiedUsers = await UserModel.countDocuments({
    isVerified: true,
    email: { $not: /@wallet\.temp$/ }
  });

  return {
    verified,
    alreadyVerified: alreadyVerifiedUsers,
    skippedWalletTemp,
    skippedInvalid
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log(`\n🚀 Setting isVerified=true for users with valid emails${dryRun ? ' (dry-run)' : ''}`);

  await connectDB();
  try {
    const { verified, alreadyVerified, skippedWalletTemp, skippedInvalid } = await verifyValidEmails(dryRun);

    console.log('\n📊 Summary');
    console.log(` - Users verified: ${verified}`);
    console.log(` - Users already verified (with valid emails): ${alreadyVerified}`);
    console.log(` - Wallet temp emails skipped: ${skippedWalletTemp}`);
    console.log(` - Invalid emails skipped: ${skippedInvalid}`);

    if (!dryRun && verified > 0) {
      console.log('\n✅ Email verification completed.');
      
      // Show verification status summary
      const totalUsers = await UserModel.countDocuments();
      const totalVerified = await UserModel.countDocuments({ isVerified: true });
      const totalUnverified = await UserModel.countDocuments({ isVerified: false });
      
      console.log('\n📈 Final verification status:');
      console.log(` - Total users: ${totalUsers}`);
      console.log(` - Verified users: ${totalVerified}`);
      console.log(` - Unverified users: ${totalUnverified} (mostly wallet.temp emails)`);
      
    } else if (dryRun) {
      console.log('\nℹ️  Dry-run complete. No changes were made.');
    } else {
      console.log('\nℹ️  No users needed verification.');
    }
  } catch (err) {
    console.error('❌ Failed to verify emails:', err);
    process.exitCode = 1;
  } finally {
    await closeConnection();
  }
}

if (require.main === module) {
  main();
}
