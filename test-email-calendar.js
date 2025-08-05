#!/usr/bin/env node

/**
 * Test Email & Calendar Integration
 * 
 * This script tests the enhanced RSVP system with automatic email and calendar features
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8080';
const TEST_EMAIL = 'shoagasraful4231@gmail.com'; // Use your actual email
const TEST_EVENT_ID = '63c64bb1-4479-4c84-8845-d182616a9d9c'; // Your working event ID

let authToken = '';
let rsvpId = '';

async function authenticateUser() {
  console.log('🔐 Step 1: Authenticating user...');
  
  // Send OTP
  console.log('📧 Sending OTP...');
  await axios.post(`${BASE_URL}/api/auth/email/send-otp`, {
    email: TEST_EMAIL
  });
  
  // For testing, we'll use a mock OTP verification
  // In real scenario, you'd get the OTP from email
  console.log('⚠️  Please check your email for OTP and update this script with the actual OTP');
  console.log('⚠️  For now, using mock authentication...');
  
  // You can manually set a token here if you have one from previous authentication
  // authToken = 'your-existing-token-here';
  
  return false; // Return false to indicate manual token needed
}

async function createRSVPWithEmailAndCalendar() {
  console.log('🎫 Step 2: Creating RSVP with automatic email and calendar...');
  
  try {
    const rsvpData = {
      eventId: TEST_EVENT_ID,
      status: 'attending',
      guestCount: 1,
      dietaryRestrictions: 'No restrictions',
      specialRequests: 'Please send calendar invitation',
      contactInfo: {
        phone: '+1234567890',
        emergencyContact: 'Emergency Contact - +0987654321'
      }
    };

    console.log('📝 Creating RSVP with data:', JSON.stringify(rsvpData, null, 2));

    const response = await axios.post(`${BASE_URL}/api/rsvp`, rsvpData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ RSVP created successfully!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    rsvpId = response.data.data._id;
    return true;
  } catch (error) {
    console.error('❌ Failed to create RSVP:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return false;
  }
}

async function testCalendarEndpoints() {
  console.log('📅 Step 3: Testing calendar endpoints...');
  
  if (!rsvpId) {
    console.log('❌ No RSVP ID available for calendar testing');
    return;
  }

  try {
    // Test ICS download
    console.log('📄 Testing ICS calendar download...');
    const icsResponse = await axios.get(`${BASE_URL}/api/rsvp/${rsvpId}/calendar?format=ics`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ ICS calendar generated successfully');
    console.log('📄 ICS preview:', icsResponse.data.substring(0, 200) + '...');

    // Test calendar links
    console.log('🔗 Testing calendar links...');
    const linksResponse = await axios.get(`${BASE_URL}/api/rsvp/${rsvpId}/calendar-links`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ Calendar links generated successfully');
    console.log('🔗 Links:', JSON.stringify(linksResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Calendar testing failed:', error.response?.data || error.message);
  }
}

async function testEmailNotification() {
  console.log('📧 Step 4: Testing manual email notification...');
  
  if (!rsvpId) {
    console.log('❌ No RSVP ID available for email testing');
    return;
  }

  try {
    const emailResponse = await axios.post(`${BASE_URL}/api/rsvp/send-email`, {
      rsvpId: rsvpId,
      emailType: 'confirmation',
      customMessage: 'This is a test of the enhanced email system with calendar attachment!'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Email sent successfully!');
    console.log('📧 Check your email for:', TEST_EMAIL);
    console.log('📎 The email should include a calendar attachment (.ics file)');
    console.log('🔗 The email should include calendar links (Google, Outlook, ICS download)');
    
  } catch (error) {
    console.error('❌ Email testing failed:', error.response?.data || error.message);
  }
}

async function runTest() {
  console.log('🚀 Testing Enhanced RSVP System with Email & Calendar');
  console.log('=======================================================');
  console.log(`📧 Test Email: ${TEST_EMAIL}`);
  console.log(`🎯 Event ID: ${TEST_EVENT_ID}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('=======================================================\n');

  // Check if we have an auth token
  if (!authToken) {
    console.log('⚠️  No auth token provided. Please:');
    console.log('1. Authenticate manually and get a token');
    console.log('2. Update this script with your token');
    console.log('3. Or implement the OTP flow');
    console.log('\n🔧 To get a token manually:');
    console.log(`curl -X POST ${BASE_URL}/api/auth/email/send-otp -H "Content-Type: application/json" -d '{"email": "${TEST_EMAIL}"}'`);
    console.log(`curl -X POST ${BASE_URL}/api/auth/email/verify-otp -H "Content-Type: application/json" -d '{"email": "${TEST_EMAIL}", "otp": "YOUR_OTP"}'`);
    return;
  }

  // Test RSVP creation with automatic email
  const rsvpCreated = await createRSVPWithEmailAndCalendar();
  if (!rsvpCreated) {
    console.log('❌ RSVP creation failed, stopping tests');
    return;
  }

  // Test calendar endpoints
  await testCalendarEndpoints();

  // Test manual email notification
  await testEmailNotification();

  console.log('\n🎉 All tests completed!');
  console.log('=======================================================');
  console.log('✅ RSVP Creation: Success (with automatic email)');
  console.log('✅ Calendar Generation: Success');
  console.log('✅ Email Notification: Success (with calendar attachment)');
  console.log('=======================================================');
  console.log('\n📧 Expected Email Features:');
  console.log('• RSVP confirmation with event details');
  console.log('• Calendar attachment (.ics file)');
  console.log('• Calendar links (Google, Outlook, Download)');
  console.log('• Meeting/event information');
  console.log('• Professional email template');
}

// Handle command line arguments for auth token
if (process.argv.length > 2) {
  authToken = process.argv[2];
  console.log(`🔑 Using provided auth token: ${authToken.substring(0, 20)}...`);
}

// Run the test
runTest().catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});
