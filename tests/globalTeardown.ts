export default async () => {
  console.log('🧹 Global Test Teardown - RSVP System');
  
  // Clean up any global resources
  // Force exit to ensure all connections are closed
  setTimeout(() => {
    process.exit(0);
  }, 1000);
};
