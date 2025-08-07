export default async () => {
  console.log('🚀 Global Test Setup - RSVP System');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.SANITY_PROJECT_ID = 'test-project';
  process.env.SANITY_DATASET = 'test';
  process.env.SANITY_API_TOKEN = 'test-token';
  
  // Disable email sending in tests
  process.env.DISABLE_EMAIL_SENDING = 'true';
};
