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
exports.cleanupDuplicateWalletAccount = cleanupDuplicateWalletAccount;
exports.deleteDuplicateAccount = deleteDuplicateAccount;
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
const usersModel_1 = __importDefault(require("../models/usersModel"));
// Load environment variables
dotenv_1.default.config();
/**
 * Script to cleanup duplicate wallet accounts created by mistake
 */
function cleanupDuplicateWalletAccount() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🔄 Starting duplicate wallet account cleanup...");
            // Connect to database
            yield (0, db_1.connectDB)();
            // Find the duplicate account with wallet temp email
            const duplicateAccount = yield usersModel_1.default.findOne({
                email: "0xa635b319a6bec867167331ef3b8578887a8d4397@wallet.temp"
            });
            if (!duplicateAccount) {
                console.log("ℹ️  No duplicate wallet account found");
                process.exit(0);
            }
            console.log("🔍 Found duplicate account:", {
                id: duplicateAccount._id,
                email: duplicateAccount.email,
                wallet_address: duplicateAccount.wallet_address,
                createdAt: duplicateAccount.createdAt
            });
            // Check if this account has any important data (RSVPs, etc.)
            // You might want to check for related data before deletion
            // For now, we'll just log what would be deleted
            console.log("⚠️  This account would be deleted. Please verify this is safe:");
            console.log("   - No RSVPs associated");
            console.log("   - No important user data");
            console.log("   - Created by mistake during wallet connection");
            // Uncomment the following lines to actually delete the account
            // await UserModel.findByIdAndDelete(duplicateAccount._id);
            // console.log("✅ Duplicate account deleted successfully");
            console.log("🛑 Account NOT deleted - uncomment deletion code if you're sure");
            // Find the real account to verify it exists
            const realAccount = yield usersModel_1.default.findOne({
                email: "asraful.islam@tutors.es"
            });
            if (realAccount) {
                console.log("✅ Real account found:", {
                    id: realAccount._id,
                    email: realAccount.email,
                    username: realAccount.username,
                    wallet_address: realAccount.wallet_address,
                    isVerified: realAccount.isVerified
                });
            }
            else {
                console.log("❌ Real account not found!");
            }
            process.exit(0);
        }
        catch (error) {
            console.error("❌ Cleanup failed:", error);
            process.exit(1);
        }
    });
}
/**
 * Script to safely delete the duplicate account after verification
 */
function deleteDuplicateAccount() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🔄 Deleting duplicate wallet account...");
            // Connect to database
            yield (0, db_1.connectDB)();
            // Find and delete the duplicate account
            const result = yield usersModel_1.default.findOneAndDelete({
                email: "0xa635b319a6bec867167331ef3b8578887a8d4397@wallet.temp"
            });
            if (result) {
                console.log("✅ Duplicate account deleted:", {
                    id: result._id,
                    email: result.email,
                    wallet_address: result.wallet_address
                });
            }
            else {
                console.log("ℹ️  No duplicate account found to delete");
            }
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
        deleteDuplicateAccount();
    }
    else {
        cleanupDuplicateWalletAccount();
    }
}
