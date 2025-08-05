#!/usr/bin/env node

/**
 * Test Environment Variables
 * 
 * This script tests if the ProtonMail environment variables are loaded correctly
 */

require('dotenv').config();

console.log('🔍 Testing Environment Variables');
console.log('================================');

// Test all SMTP configurations
const smtpConfigs = {
  'KARA': {
    username: process.env.SMTP_USERNAME_KARA,
    token: process.env.SMTP_TOKEN_KARA
  },
  'PARTNERS': {
    username: process.env.SMTP_USERNAME_PARTNERS,
    token: process.env.SMTP_TOKEN_PARTNERS
  },
  'GUIDES': {
    username: process.env.SMTP_USERNAME_GUIDES,
    token: process.env.SMTP_TOKEN_GUIDES
  },
  'SCHOLARS': {
    username: process.env.SMTP_USERNAME_SCHOLARS,
    token: process.env.SMTP_TOKEN_SCHOLARS
  },
  'EVENTS': {
    username: process.env.SMTP_USERNAME_EVENTS,
    token: process.env.SMTP_TOKEN_EVENTS
  },
  'MEMBERS': {
    username: process.env.SMTP_USERNAME_MEMBERS,
    token: process.env.SMTP_TOKEN_MEMBERS
  }
};

console.log('\n📧 SMTP Configurations:');
console.log('========================');

Object.entries(smtpConfigs).forEach(([name, config]) => {
  const hasUsername = !!config.username;
  const hasToken = !!config.token;
  const status = hasUsername && hasToken ? '✅' : '❌';
  
  console.log(`${status} ${name}:`);
  console.log(`   Username: ${hasUsername ? config.username : 'MISSING'}`);
  console.log(`   Token: ${hasToken ? config.token.substring(0, 8) + '...' : 'MISSING'}`);
  console.log('');
});

// Test the specific configuration that RSVP emails use
console.log('\n🎯 RSVP Email Configuration (events):');
console.log('=====================================');

const eventsConfig = {
  username: process.env.SMTP_USERNAME_EVENTS,
  token: process.env.SMTP_TOKEN_EVENTS
};

if (eventsConfig.username && eventsConfig.token) {
  console.log('✅ EVENTS configuration is COMPLETE');
  console.log(`   Username: ${eventsConfig.username}`);
  console.log(`   Token: ${eventsConfig.token.substring(0, 8)}...`);
  console.log('   🎉 RSVP emails should work!');
} else {
  console.log('❌ EVENTS configuration is INCOMPLETE');
  console.log(`   Username: ${eventsConfig.username || 'MISSING'}`);
  console.log(`   Token: ${eventsConfig.token || 'MISSING'}`);
  console.log('   💥 RSVP emails will FAIL!');
}

// Test other important environment variables
console.log('\n🔧 Other Important Variables:');
console.log('=============================');

const otherVars = {
  'SMTP_SERVER': process.env.SMTP_SERVER,
  'SMTP_PORT': process.env.SMTP_PORT,
  'NODE_ENV': process.env.NODE_ENV,
  'PORT': process.env.PORT
};

Object.entries(otherVars).forEach(([name, value]) => {
  const status = value ? '✅' : '❌';
  console.log(`${status} ${name}: ${value || 'MISSING'}`);
});

console.log('\n🚀 Next Steps:');
console.log('==============');

if (!eventsConfig.username || !eventsConfig.token) {
  console.log('1. ❌ Fix the EVENTS configuration in your .env file');
  console.log('2. 🔄 Restart your server completely');
  console.log('3. 🧪 Test RSVP creation again');
} else {
  console.log('1. ✅ Environment variables look good');
  console.log('2. 🔄 Make sure to restart your server');
  console.log('3. 🧪 Test RSVP creation');
}

console.log('\n💡 To restart server:');
console.log('   1. Stop current server (Ctrl+C)');
console.log('   2. Run: npm run dev');
console.log('   3. Test RSVP creation');
