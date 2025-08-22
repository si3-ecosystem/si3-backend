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
const redisHelper_1 = __importDefault(require("../helpers/redisHelper"));
dotenv_1.default.config();
function clearRSVPCache() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🧹 Clearing RSVP cache...\n');
            const userId = '689db781ae7877ef81bbfd4e'; // Your user ID
            // Clear all possible cache keys for this user
            const cacheKeys = [
                `user_rsvps_${userId}_1_10_all`,
                `user_rsvps_${userId}_1_10_undefined`,
                `user_rsvps_${userId}_1_10_`,
                `user_rsvps_${userId}_1_10_attending`,
                `user_rsvps_${userId}_1_10_not_attending`,
                `user_rsvps_${userId}_1_10_waitlisted`,
            ];
            console.log('🗑️  Clearing cache keys:');
            for (const key of cacheKeys) {
                console.log(`   - ${key}`);
                yield redisHelper_1.default.cacheDelete(key);
            }
            console.log('\n✅ Cache cleared successfully!');
            console.log('Now try calling GET /api/rsvp/my-rsvps again');
        }
        catch (error) {
            console.error('❌ Error clearing cache:', error);
        }
    });
}
if (require.main === module) {
    clearRSVPCache();
}
