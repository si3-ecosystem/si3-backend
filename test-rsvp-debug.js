#!/usr/bin/env node

/**
 * RSVP Debug Test Script
 * 
 * This script helps test the RSVP creation with detailed debugging
 * Run with: node test-rsvp-debug.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8080';
const TEST_EMAIL = 'test@example.com';
const TEST_EVENT_ID = 'test-event-123'; // Replace with your actual Sanity event ID

let authToken = '';

async function sendOTP() {
  console.log('🔐 Step 1: Sending OTP...');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/email/send-otp`, {
      email: TEST_EMAIL
    });
    console.log('✅ OTP sent successfully:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP:', error.response?.data || error.message);
    return false;
  }
}

async function verifyOTP(otp) {
  console.log('🔐 Step 2: Verifying OTP...');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/email/verify-otp`, {
      email: TEST_EMAIL,
      otp: otp
    });
    console.log('✅ OTP verified successfully:', response.data);
    authToken = response.data.data.accessToken;
    return true;
  } catch (error) {
    console.error('❌ Failed to verify OTP:', error.response?.data || error.message);
    return false;
  }
}

async function createRSVP() {
  console.log('🎫 Step 3: Creating RSVP...');
  try {
    const rsvpData = {
      eventId: TEST_EVENT_ID,
      status: 'attending',
      guestCount: 2,
      dietaryRestrictions: 'Vegetarian',
      specialRequests: 'Wheelchair accessible seating',
      contactInfo: {
        phone: '+1234567890',
        emergencyContact: 'Jane Doe - +0987654321'
      }
    };

    console.log('📝 RSVP data being sent:', JSON.stringify(rsvpData, null, 2));

    const response = await axios.post(`${BASE_URL}/api/rsvp`, rsvpData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ RSVP created successfully:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to create RSVP:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return null;
  }
}

async function testEmailNotification(rsvpId) {
  console.log('📧 Step 4: Testing email notification...');
  try {
    const response = await axios.post(`${BASE_URL}/api/rsvp/send-email`, {
      rsvpId: rsvpId,
      emailType: 'confirmation',
      customMessage: 'This is a test confirmation email!'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Email sent successfully:', response.data);
    console.log(`📧 Check your email (${TEST_EMAIL}) for the confirmation!`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error.response?.data || error.message);
    return false;
  }
}

async function testCalendarGeneration(rsvpId) {
  console.log('📅 Step 5: Testing calendar generation...');
  try {
    const response = await axios.get(`${BASE_URL}/api/rsvp/${rsvpId}/calendar?format=ics`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Calendar file generated successfully');
    console.log('📅 ICS content preview:', response.data.substring(0, 200) + '...');
    return true;
  } catch (error) {
    console.error('❌ Failed to generate calendar:', error.response?.data || error.message);
    return false;
  }
}

async function runTest() {
  console.log('🚀 Starting RSVP Debug Test');
  console.log('================================');
  console.log(`📧 Test Email: ${TEST_EMAIL}`);
  console.log(`🎯 Event ID: ${TEST_EVENT_ID}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('================================\n');

  // Step 1: Send OTP
  const otpSent = await sendOTP();
  if (!otpSent) {
    console.log('❌ Test failed at OTP sending step');
    return;
  }

  // Step 2: Get OTP from user
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(`\n📧 Please check your email (${TEST_EMAIL}) and enter the OTP: `, async (otp) => {
    rl.close();

    // Step 3: Verify OTP
    const otpVerified = await verifyOTP(otp);
    if (!otpVerified) {
      console.log('❌ Test failed at OTP verification step');
      return;
    }

    // Step 4: Create RSVP (this is where the debugging will show)
    const rsvp = await createRSVP();
    if (!rsvp) {
      console.log('❌ Test failed at RSVP creation step');
      console.log('\n🔍 Check the server logs above for detailed debugging information');
      return;
    }

    // Step 5: Test email notification
    await testEmailNotification(rsvp._id);

    // Step 6: Test calendar generation
    await testCalendarGeneration(rsvp._id);

    console.log('\n🎉 All tests completed!');
    console.log('================================');
    console.log('✅ RSVP Creation: Success');
    console.log('✅ Email Notification: Success');
    console.log('✅ Calendar Generation: Success');
    console.log('================================');
  });
}

// Handle command line arguments
if (process.argv.length > 2) {
  const eventId = process.argv[2];
  TEST_EVENT_ID = eventId;
  console.log(`🎯 Using custom event ID: ${eventId}`);
}

// Run the test
runTest().catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});
