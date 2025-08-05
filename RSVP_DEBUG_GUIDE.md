# 🐛 **RSVP System Debug Guide**

## **Issue Analysis**

The error "Maximum null guests allowed per RSVP" indicates that `event.rsvpSettings.maxGuestsPerRSVP` is `null` or `undefined` in your Sanity CMS data.

## **🔍 Comprehensive Debugging Added**

I've added detailed debugging to track the complete data flow:

### **1. RSVP Controller Debug Points**
- ✅ **Step 1**: Sanity event data fetching
- ✅ **Step 2**: Existing RSVP check
- ✅ **Step 3**: Guest count validation (with null handling)
- ✅ **Step 4**: Event capacity checking
- ✅ **Step 5**: MongoDB RSVP creation
- ✅ **Step 6**: Redis cache clearing

### **2. Sanity Service Debug Points**
- ✅ **Raw data fetching** from Sanity CMS
- ✅ **RSVP settings analysis** (null/undefined detection)
- ✅ **Validation checks** (enabled, deadline, event date)
- ✅ **Error handling** with detailed logging

## **🚀 Testing Instructions**

### **Method 1: Using the Debug Test Script**

```bash
# Install axios if not already installed
npm install axios

# Run the debug test script
node test-rsvp-debug.js

# Or with a custom event ID
node test-rsvp-debug.js your-sanity-event-id
```

### **Method 2: Using Postman Collection**

1. **Import the collection**: `postman-collections/RSVP_Complete_Testing_Collection.json`
2. **Set environment variables**:
   - `baseUrl`: `http://localhost:8080`
   - `testEmail`: `your-test-email@example.com`
   - `eventId`: `your-sanity-event-id`

3. **Run the requests in order**:
   - 🔐 Authentication → Send Email OTP
   - 🔐 Authentication → Verify Email OTP
   - 📝 RSVP Operations → Create RSVP

### **Method 3: Manual cURL Testing**

```bash
# 1. Send OTP
curl -X POST http://localhost:8080/api/auth/email/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 2. Verify OTP (replace 123456 with actual OTP)
curl -X POST http://localhost:8080/api/auth/email/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp": "123456"}'

# 3. Create RSVP (replace TOKEN and EVENT_ID)
curl -X POST http://localhost:8080/api/rsvp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": "YOUR_EVENT_ID",
    "status": "attending",
    "guestCount": 2,
    "dietaryRestrictions": "Vegetarian",
    "specialRequests": "Wheelchair accessible"
  }'
```

## **🔍 Debug Output Analysis**

When you run the RSVP creation, you'll see detailed logs like this:

### **Expected Debug Output**

```
🎫 Creating RSVP for user 507f1f77bcf86cd799439011 and event test-event-123
📝 Request body: {
  "eventId": "test-event-123",
  "status": "attending",
  "guestCount": 2,
  ...
}

🔍 Sanity: Fetching event data for eventId: test-event-123
📊 Sanity: Raw event data received: {
  "_id": "test-event-123",
  "title": "Test Guide Session",
  "rsvpSettings": {
    "enabled": true,
    "maxGuestsPerRSVP": null,  // ← THIS IS THE ISSUE!
    "maxCapacity": 50,
    "waitlistEnabled": true
  }
}

📊 Guest count validation: {
  "requestedGuestCount": 2,
  "maxGuestsPerRSVP": null,
  "isMaxGuestsNull": true,
  "typeOfMaxGuests": "object"
}

📊 Using maxGuestsPerRSVP: 5 (default value)
✅ Guest count validation passed: 2 <= 5
```

## **🛠️ Fixing the Issue**

### **Root Cause**
Your Sanity CMS `guidesSession` document is missing the `maxGuestsPerRSVP` value or it's set to `null`.

### **Solution 1: Fix in Sanity CMS**

1. **Go to your Sanity Studio**
2. **Edit the guide session** with the problematic event ID
3. **Set RSVP Settings**:
   - ✅ Enable RSVP: `true`
   - ✅ Max Guests Per RSVP: `5` (or your desired number)
   - ✅ Max Capacity: `50` (or your desired number)
   - ✅ Waitlist Enabled: `true`

### **Solution 2: Update Sanity Schema**

Add default values to your `guidesSession` schema:

```javascript
// In your Sanity schema file
{
  name: 'rsvpSettings',
  title: 'RSVP Settings',
  type: 'object',
  fields: [
    {
      name: 'enabled',
      title: 'Enable RSVP',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'maxGuestsPerRSVP',
      title: 'Maximum Guests Per RSVP',
      type: 'number',
      initialValue: 5,  // ← Add this default
      validation: Rule => Rule.min(1).max(20)
    },
    {
      name: 'maxCapacity',
      title: 'Maximum Event Capacity',
      type: 'number',
      initialValue: 50  // ← Add this default
    },
    {
      name: 'waitlistEnabled',
      title: 'Enable Waitlist',
      type: 'boolean',
      initialValue: true
    }
  ]
}
```

### **Solution 3: Backend Fallback (Already Implemented)**

The debug code I added includes a fallback:

```typescript
// Handle null/undefined maxGuestsPerRSVP with default value
const maxGuestsPerRSVP = event.rsvpSettings?.maxGuestsPerRSVP || 5;
```

This ensures the system works even if Sanity data is incomplete.

## **📧 Email Testing**

After fixing the RSVP creation, test the email functionality:

### **1. RSVP Confirmation Email**
```bash
curl -X POST http://localhost:8080/api/rsvp/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "rsvpId": "YOUR_RSVP_ID",
    "emailType": "confirmation",
    "customMessage": "Welcome to our event!"
  }'
```

### **2. Event Reminder Email**
```bash
curl -X POST http://localhost:8080/api/rsvp/send-reminder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": "YOUR_EVENT_ID",
    "reminderType": "24_hours",
    "customMessage": "Don't forget tomorrow's event!"
  }'
```

## **📅 Calendar Testing**

Test calendar generation:

```bash
# Download ICS file
curl -X GET "http://localhost:8080/api/rsvp/YOUR_RSVP_ID/calendar?format=ics" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get calendar links
curl -X GET "http://localhost:8080/api/rsvp/YOUR_RSVP_ID/calendar-links" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## **🎯 Success Criteria**

Your RSVP system is working correctly when you see:

- ✅ **Sanity Data**: Complete RSVP settings with valid `maxGuestsPerRSVP`
- ✅ **RSVP Creation**: Successful MongoDB document creation
- ✅ **Email Delivery**: ProtonMail sends confirmation emails
- ✅ **Calendar Generation**: Valid ICS files with event details
- ✅ **Cache Management**: Redis cache properly updated

## **🆘 Troubleshooting**

### **Common Issues**

1. **"Event not found"**
   - Check if the `eventId` exists in Sanity CMS
   - Verify the document type is `guidesSession`

2. **"RSVP is not enabled"**
   - Set `rsvpSettings.enabled` to `true` in Sanity

3. **"Maximum null guests allowed"**
   - Set `rsvpSettings.maxGuestsPerRSVP` to a number (e.g., 5)

4. **Email not sending**
   - Check ProtonMail SMTP credentials
   - Verify `events@si3.space` configuration

5. **Calendar generation fails**
   - Check if RSVP exists and is populated with user data
   - Verify Sanity event data includes required fields

### **Debug Log Locations**

- **Server Console**: Real-time debugging output
- **Browser Network Tab**: API request/response details
- **Postman Console**: Test execution logs
- **Email Inbox**: Actual email delivery verification

---

**🎉 Your RSVP system debugging is now comprehensive and ready for testing!**
