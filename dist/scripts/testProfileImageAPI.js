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
function testProfileImageAPI() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, db_1.connectDB)();
        try {
            console.log('🧪 Testing Profile Image API Setup...\n');
            // Test 1: Check if profileImage field exists in user model
            console.log('1️⃣ Testing user model with profileImage field...');
            // Find a test user
            const testUser = yield usersModel_1.default.findOne({
                email: { $not: /@wallet\.temp$/ }
            }).limit(1);
            if (!testUser) {
                console.log('❌ No test user found');
                return;
            }
            console.log(`✅ Found test user: ${testUser.email}`);
            // Test 2: Update user with a test profile image URL
            const testImageUrl = 'https://gateway.pinata.cloud/ipfs/QmTestHash123456789';
            console.log('\n2️⃣ Testing profile image update...');
            const updatedUser = yield usersModel_1.default.findByIdAndUpdate(testUser._id, {
                profileImage: testImageUrl,
                settingsUpdatedAt: new Date()
            }, { new: true, runValidators: true });
            if (updatedUser && updatedUser.profileImage === testImageUrl) {
                console.log('✅ Profile image field updated successfully');
                console.log(`   Image URL: ${updatedUser.profileImage}`);
            }
            else {
                console.log('❌ Profile image update failed');
            }
            // Test 3: Test validation with invalid URL
            console.log('\n3️⃣ Testing profile image validation...');
            try {
                yield usersModel_1.default.findByIdAndUpdate(testUser._id, { profileImage: 'invalid-url' }, { new: true, runValidators: true });
                console.log('❌ Validation should have failed for invalid URL');
            }
            catch (error) {
                console.log('✅ Validation correctly rejected invalid URL');
            }
            // Test 4: Clear the test image
            console.log('\n4️⃣ Cleaning up test data...');
            yield usersModel_1.default.findByIdAndUpdate(testUser._id, { $unset: { profileImage: 1 } }, { new: true });
            console.log('✅ Test profile image cleared');
            console.log('\n🎉 Profile Image API tests completed successfully!');
            console.log('\n📋 Available endpoints:');
            console.log('   POST /api/pinata/upload - General image upload');
            console.log('   POST /api/pinata/upload-profile-image - Upload & set profile image (requires auth)');
            console.log('   PATCH /api/auth/profile - Update profile including profileImage field');
        }
        catch (error) {
            console.error('❌ Test failed:', error);
        }
        finally {
            yield (0, db_1.closeConnection)();
        }
    });
}
if (require.main === module) {
    testProfileImageAPI();
}
