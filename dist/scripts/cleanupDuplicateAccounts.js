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
exports.cleanupDuplicateAccounts = cleanupDuplicateAccounts;
exports.deleteDuplicateAccounts = deleteDuplicateAccounts;
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
const usersModel_1 = __importDefault(require("../models/usersModel"));
// Load environment variables
dotenv_1.default.config();
/**
 * Script to cleanup duplicate accounts created during testing
 */
function cleanupDuplicateAccounts() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🔄 Starting duplicate account cleanup...");
            // Connect to database
            yield (0, db_1.connectDB)();
            // Find all accounts with the test email
            const testEmail = "asraful.islam@tutors.es";
            const accounts = yield usersModel_1.default.find({ email: testEmail })
                .select('_id email username wallet_address createdAt isVerified roles')
                .sort({ createdAt: 1 }); // Oldest first
            console.log(`📊 Found ${accounts.length} accounts with email: ${testEmail}`);
            if (accounts.length <= 1) {
                console.log("✅ No duplicate accounts found");
                process.exit(0);
            }
            // Display all accounts
            console.log("\n📋 All accounts:");
            accounts.forEach((account, index) => {
                console.log(`${index + 1}. ID: ${account._id}`);
                console.log(`   Email: ${account.email}`);
                console.log(`   Username: ${account.username || 'none'}`);
                console.log(`   Wallet: ${account.wallet_address || 'none'}`);
                console.log(`   Verified: ${account.isVerified}`);
                console.log(`   Roles: ${account.roles.join(', ')}`);
                console.log(`   Created: ${account.createdAt}`);
                console.log('');
            });
            // Keep the oldest account (most likely the original)
            const keepAccount = accounts[0];
            const duplicateAccounts = accounts.slice(1);
            console.log(`✅ Keeping account: ${keepAccount._id} (oldest, created: ${keepAccount.createdAt})`);
            console.log(`❌ Will delete ${duplicateAccounts.length} duplicate accounts:`);
            duplicateAccounts.forEach((account, index) => {
                console.log(`   ${index + 1}. ${account._id} (created: ${account.createdAt})`);
            });
            // Uncomment the following lines to actually delete the duplicates
            /*
            for (const account of duplicateAccounts) {
              await UserModel.findByIdAndDelete(account._id);
              console.log(`🗑️  Deleted account: ${account._id}`);
            }
            
            console.log(`✅ Cleanup completed! Deleted ${duplicateAccounts.length} duplicate accounts`);
            */
            console.log("\n⚠️  Accounts NOT deleted - uncomment deletion code if you're sure");
            console.log("💡 Run with --delete flag to actually delete duplicates");
            process.exit(0);
        }
        catch (error) {
            console.error("❌ Cleanup failed:", error);
            process.exit(1);
        }
    });
}
/**
 * Actually delete duplicate accounts
 */
function deleteDuplicateAccounts() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🔄 Deleting duplicate accounts...");
            // Connect to database
            yield (0, db_1.connectDB)();
            const testEmail = "asraful.islam@tutors.es";
            const accounts = yield usersModel_1.default.find({ email: testEmail })
                .select('_id email createdAt')
                .sort({ createdAt: 1 }); // Oldest first
            if (accounts.length <= 1) {
                console.log("✅ No duplicate accounts to delete");
                process.exit(0);
            }
            // Keep the oldest, delete the rest
            const keepAccount = accounts[0];
            const duplicateAccounts = accounts.slice(1);
            console.log(`✅ Keeping: ${keepAccount._id} (created: ${keepAccount.createdAt})`);
            let deletedCount = 0;
            for (const account of duplicateAccounts) {
                yield usersModel_1.default.findByIdAndDelete(account._id);
                console.log(`🗑️  Deleted: ${account._id} (created: ${account.createdAt})`);
                deletedCount++;
            }
            console.log(`✅ Cleanup completed! Deleted ${deletedCount} duplicate accounts`);
            // Verify the result
            const remainingAccounts = yield usersModel_1.default.find({ email: testEmail });
            console.log(`🔍 Verification: ${remainingAccounts.length} account(s) remaining`);
            process.exit(0);
        }
        catch (error) {
            console.error("❌ Deletion failed:", error);
            process.exit(1);
        }
    });
}
// Run cleanup or deletion based on command line argument
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.includes('--delete')) {
        deleteDuplicateAccounts();
    }
    else {
        cleanupDuplicateAccounts();
    }
}
