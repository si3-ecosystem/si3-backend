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
dotenv_1.default.config();
function isValidEmail(email) {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isWalletTempEmail(email) {
    return email.includes('@wallet.temp');
}
function verifyValidEmails() {
    return __awaiter(this, arguments, void 0, function* (dryRun = false) {
        let verified = 0;
        let alreadyVerified = 0;
        let skippedWalletTemp = 0;
        let skippedInvalid = 0;
        console.log(`🔍 Finding users with valid emails to verify...${dryRun ? ' (dry-run)' : ''}`);
        // Find all users who are not verified and have valid emails (not wallet.temp)
        const users = yield usersModel_1.default.find({
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
                yield usersModel_1.default.findByIdAndUpdate(user._id, {
                    isVerified: true,
                    settingsUpdatedAt: new Date()
                });
                verified++;
                console.log(`✅ Verified: ${user.email}`);
            }
            catch (error) {
                console.error(`❌ Error processing ${user.email}:`, error);
            }
        }
        // Count already verified users with valid emails
        const alreadyVerifiedUsers = yield usersModel_1.default.countDocuments({
            isVerified: true,
            email: { $not: /@wallet\.temp$/ }
        });
        return {
            verified,
            alreadyVerified: alreadyVerifiedUsers,
            skippedWalletTemp,
            skippedInvalid
        };
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const args = process.argv.slice(2);
        const dryRun = args.includes('--dry-run');
        console.log(`\n🚀 Setting isVerified=true for users with valid emails${dryRun ? ' (dry-run)' : ''}`);
        yield (0, db_1.connectDB)();
        try {
            const { verified, alreadyVerified, skippedWalletTemp, skippedInvalid } = yield verifyValidEmails(dryRun);
            console.log('\n📊 Summary');
            console.log(` - Users verified: ${verified}`);
            console.log(` - Users already verified (with valid emails): ${alreadyVerified}`);
            console.log(` - Wallet temp emails skipped: ${skippedWalletTemp}`);
            console.log(` - Invalid emails skipped: ${skippedInvalid}`);
            if (!dryRun && verified > 0) {
                console.log('\n✅ Email verification completed.');
                // Show verification status summary
                const totalUsers = yield usersModel_1.default.countDocuments();
                const totalVerified = yield usersModel_1.default.countDocuments({ isVerified: true });
                const totalUnverified = yield usersModel_1.default.countDocuments({ isVerified: false });
                console.log('\n📈 Final verification status:');
                console.log(` - Total users: ${totalUsers}`);
                console.log(` - Verified users: ${totalVerified}`);
                console.log(` - Unverified users: ${totalUnverified} (mostly wallet.temp emails)`);
            }
            else if (dryRun) {
                console.log('\nℹ️  Dry-run complete. No changes were made.');
            }
            else {
                console.log('\nℹ️  No users needed verification.');
            }
        }
        catch (err) {
            console.error('❌ Failed to verify emails:', err);
            process.exitCode = 1;
        }
        finally {
            yield (0, db_1.closeConnection)();
        }
    });
}
if (require.main === module) {
    main();
}
