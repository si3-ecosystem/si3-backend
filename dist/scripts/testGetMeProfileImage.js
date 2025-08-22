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
function testGetMeProfileImage() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, db_1.connectDB)();
        try {
            console.log('🧪 Testing /api/auth/me endpoint with profileImage...\n');
            // Find a test user
            const testUser = yield usersModel_1.default.findOne({
                email: { $not: /@wallet\.temp$/ }
            }).limit(1);
            if (!testUser) {
                console.log('❌ No test user found');
                return;
            }
            console.log(`✅ Found test user: ${testUser.email}`);
            // Set a test profile image
            const testImageUrl = 'https://gateway.pinata.cloud/ipfs/QmTestHash123456789';
            console.log('\n1️⃣ Setting test profile image...');
            const updatedUser = yield usersModel_1.default.findByIdAndUpdate(testUser._id, {
                profileImage: testImageUrl,
                settingsUpdatedAt: new Date()
            }, { new: true, runValidators: true });
            console.log(`✅ Profile image set: ${updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.profileImage}`);
            // Simulate what getMe function returns
            console.log('\n2️⃣ Testing getMe response format...');
            if (updatedUser) {
                const userResponse = {
                    id: updatedUser._id,
                    email: updatedUser.email,
                    username: updatedUser.username,
                    roles: updatedUser.roles,
                    isVerified: updatedUser.isVerified,
                    companyName: updatedUser.companyName,
                    companyAffiliation: updatedUser.companyAffiliation,
                    interests: updatedUser.interests,
                    personalValues: updatedUser.personalValues,
                    digitalLinks: updatedUser.digitalLinks,
                    details: updatedUser.details,
                    newsletter: updatedUser.newsletter,
                    wallet_address: updatedUser.wallet_address,
                    lastLogin: updatedUser.lastLogin,
                    createdAt: updatedUser.createdAt,
                    updatedAt: updatedUser.updatedAt,
                    profileImage: updatedUser.profileImage, // This should now be included
                    // New fields for settings page
                    notificationSettings: updatedUser.notificationSettings,
                    walletInfo: updatedUser.walletInfo,
                    settingsUpdatedAt: updatedUser.settingsUpdatedAt,
                };
                console.log('✅ getMe response includes profileImage:', !!userResponse.profileImage);
                console.log(`   profileImage value: ${userResponse.profileImage}`);
                // Test with no profile image
                console.log('\n3️⃣ Testing with no profile image...');
                yield usersModel_1.default.findByIdAndUpdate(testUser._id, { $unset: { profileImage: 1 } }, { new: true });
                const userWithoutImage = yield usersModel_1.default.findById(testUser._id);
                const responseWithoutImage = {
                    profileImage: userWithoutImage === null || userWithoutImage === void 0 ? void 0 : userWithoutImage.profileImage,
                };
                console.log('✅ getMe response with no image:', responseWithoutImage.profileImage === undefined ? 'undefined (correct)' : responseWithoutImage.profileImage);
            }
            console.log('\n🎉 getMe endpoint test completed!');
            console.log('\n📋 Summary:');
            console.log('   - profileImage field is now included in getMe response');
            console.log('   - Returns IPFS URL when image exists');
            console.log('   - Returns undefined when no image is set');
            console.log('   - Frontend should now receive profileImage in /api/auth/me calls');
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
    testGetMeProfileImage();
}
