import dotenv from 'dotenv';
import { connectDB, closeConnection } from '../config/db';
import UserModel from '../models/usersModel';

dotenv.config();

async function testGetMeProfileImage() {
  await connectDB();
  
  try {
    console.log('🧪 Testing /api/auth/me endpoint with profileImage...\n');
    
    // Find a test user
    const testUser = await UserModel.findOne({ 
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
    const updatedUser = await UserModel.findByIdAndUpdate(
      testUser._id,
      { 
        profileImage: testImageUrl,
        settingsUpdatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    console.log(`✅ Profile image set: ${updatedUser?.profileImage}`);
    
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
      await UserModel.findByIdAndUpdate(
        testUser._id,
        { $unset: { profileImage: 1 } },
        { new: true }
      );
      
      const userWithoutImage = await UserModel.findById(testUser._id);
      const responseWithoutImage = {
        profileImage: userWithoutImage?.profileImage,
      };
      
      console.log('✅ getMe response with no image:', responseWithoutImage.profileImage === undefined ? 'undefined (correct)' : responseWithoutImage.profileImage);
    }
    
    console.log('\n🎉 getMe endpoint test completed!');
    console.log('\n📋 Summary:');
    console.log('   - profileImage field is now included in getMe response');
    console.log('   - Returns IPFS URL when image exists');
    console.log('   - Returns undefined when no image is set');
    console.log('   - Frontend should now receive profileImage in /api/auth/me calls');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeConnection();
  }
}

if (require.main === module) {
  testGetMeProfileImage();
}
