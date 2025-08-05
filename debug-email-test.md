# RSVP Email Debug Guide

This guide explains how to use the new debug endpoints to troubleshoot RSVP email issues.

## New Debug Endpoints

### 1. Debug RSVP Email Status
**GET** `/api/rsvp/:rsvpId/email-debug`

This endpoint provides comprehensive debug information about an RSVP's email configuration and status.

#### Example Request:
```bash
curl -X GET "http://localhost:8080/api/rsvp/6891f36bafa60e61e7a2aad0/email-debug" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Response Example:
```json
{
  "status": "success",
  "message": "RSVP email debug information retrieved",
  "data": {
    "rsvp": {
      "id": "6891f36bafa60e61e7a2aad0",
      "eventId": "63c64bb1-4479-4c84-8845-d182616a9d9c",
      "userId": "6891c2853fecc41d98dfe6a3",
      "status": "attending",
      "confirmationEmailSent": true,
      "reminderEmailsSent": [],
      "approvalStatus": "approved",
      "createdAt": "2025-08-05T12:04:59.146Z",
      "updatedAt": "2025-08-05T12:05:13.171Z"
    },
    "user": {
      "email": "user@example.com",
      "emailValid": true
    },
    "event": {
      "id": "63c64bb1-4479-4c84-8845-d182616a9d9c",
      "title": "Event Title",
      "eventDate": "2025-08-10T18:00:00.000Z",
      "organizer": {
        "name": "SI3 Events Team",
        "email": "events@si3.space"
      }
    },
    "emailConfig": {
      "smtpStatus": {
        "hasUsername": true,
        "hasToken": true,
        "isConfigured": true
      },
      "smtpConnectionTest": true,
      "smtpError": null,
      "senderEmail": "events@si3.space",
      "emailType": "rsvp"
    },
    "environment": {
      "SMTP_USERNAME_EVENTS": true,
      "SMTP_TOKEN_EVENTS": true,
      "SMTP_SERVER": "smtp.protonmail.ch",
      "SMTP_PORT": "587",
      "API_BASE_URL": "http://localhost:8080",
      "BASE_URL": null
    }
  },
  "recommendations": [
    "Configuration appears correct. Email should be working. Check spam folder or try resending."
  ]
}
```

### 2. Resend RSVP Email
**POST** `/api/rsvp/:rsvpId/resend-email`

This endpoint allows you to manually resend confirmation or reminder emails for debugging purposes.

#### Example Request:
```bash
curl -X POST "http://localhost:8080/api/rsvp/6891f36bafa60e61e7a2aad0/resend-email" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailType": "confirmation",
    "customMessage": "Debug test: Resending your confirmation email",
    "force": true
  }'
```

#### Request Body Parameters:
- `emailType` (optional): "confirmation" or "reminder" (default: "confirmation")
- `customMessage` (optional): Custom message to include in the email
- `force` (optional): If true, resets the confirmationEmailSent flag before sending

#### Response Example:
```json
{
  "status": "success",
  "message": "Confirmation email resent successfully",
  "data": {
    "emailType": "confirmation",
    "success": true,
    "duration": "1234ms",
    "timestamp": "2025-08-05T12:30:00.000Z",
    "rsvpUpdated": {
      "confirmationEmailSent": true,
      "reminderEmailsSent": []
    }
  }
}
```

## Debugging Your Specific Issue

For your RSVP ID `6891f36bafa60e61e7a2aad0`, follow these steps:

### Step 1: Check Debug Information
```bash
curl -X GET "http://localhost:8080/api/rsvp/6891f36bafa60e61e7a2aad0/email-debug" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This will show you:
- Whether the email was marked as sent
- SMTP configuration status
- Environment variables
- Event and user data
- Specific recommendations

### Step 2: Check SMTP Status
```bash
curl -X GET "http://localhost:8080/api/email/smtp-status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 3: Try Resending the Email
```bash
curl -X POST "http://localhost:8080/api/rsvp/6891f36bafa60e61e7a2aad0/resend-email" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailType": "confirmation",
    "customMessage": "Debug test: Manual resend",
    "force": true
  }'
```

## Enhanced Logging

The system now includes detailed logging for email operations. Check your server logs for entries like:

```
[EMAIL DEBUG] Starting email send attempt: { emailType: 'rsvp', to: 'user@example.com', ... }
[RSVP EMAIL DEBUG] Starting confirmation email for RSVP: 6891f36bafa60e61e7a2aad0
[EMAIL DEBUG] Email sent successfully: { messageId: '...', duration: '1234ms' }
```

## Common Issues and Solutions

1. **SMTP Configuration**: Check that `SMTP_USERNAME_EVENTS` and `SMTP_TOKEN_EVENTS` are set
2. **Email Marked as Sent**: The `confirmationEmailSent` flag might be true even if email failed
3. **Spam Folder**: Check recipient's spam/junk folder
4. **Event Data**: Ensure the event exists in Sanity and has proper organizer information
5. **User Email**: Verify the user's email address is valid

## Environment Variables Required

Make sure these environment variables are set:
- `SMTP_USERNAME_EVENTS`
- `SMTP_TOKEN_EVENTS`
- `SMTP_SERVER` (default: smtp.protonmail.ch)
- `SMTP_PORT` (default: 587)
- `API_BASE_URL` or `BASE_URL`

## Next Steps

1. Run the debug endpoint to see the current status
2. Check the server logs for detailed email sending information
3. Try resending the email manually
4. If issues persist, check ProtonMail SMTP credentials and settings
