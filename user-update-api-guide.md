# User Information Update APIs

## 📋 Available User APIs

### 1. Get Current User Profile
**GET** `/api/auth/me`

Get the current authenticated user's profile information.

#### Example Request:
```bash
curl -X GET "http://localhost:8080/api/auth/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "6891c2853fecc41d98dfe6a3",
      "email": "0xa635b319a6bec867167331ef3b8578887a8d4397@wallet.temp",
      "roles": ["scholar"],
      "isVerified": true,
      "companyName": null,
      "companyAffiliation": null,
      "interests": [],
      "personalValues": [],
      "digitalLinks": [],
      "details": null,
      "newsletter": false,
      "wallet_address": "0xa635b319a6bec867167331ef3b8578887a8d4397",
      "lastLogin": "2025-08-05T12:22:50.000Z",
      "createdAt": "2025-08-05T10:15:33.000Z",
      "updatedAt": "2025-08-05T12:22:50.000Z"
    }
  }
}
```

### 2. Update User Profile (Including Email)
**PATCH** `/api/auth/profile`

Update user profile information including email address (partial update).

#### Example Request:
```bash
curl -X PATCH "http://localhost:8080/api/auth/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shoagasraful4231@gmail.com",
    "companyName": "My Company",
    "interests": ["blockchain", "web3"],
    "newsletter": true
  }'
```

#### Request Body Parameters:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | No | New email address (must be valid, no wallet.temp emails) |
| `companyName` | string | No | Company name (max 200 chars) |
| `companyAffiliation` | string | No | Company affiliation (max 200 chars) |
| `interests` | array | No | Array of interest strings (max 100 chars each) |
| `personalValues` | array | No | Array of personal value strings (max 100 chars each) |
| `digitalLinks` | array | No | Array of digital link objects |
| `details` | string | No | Additional details (max 2000 chars) |
| `newsletter` | boolean | No | Newsletter subscription preference |

#### Digital Links Format:
```json
{
  "digitalLinks": [
    {
      "platform": "github",
      "url": "https://github.com/username"
    },
    {
      "platform": "linkedin", 
      "url": "https://linkedin.com/in/username"
    }
  ]
}
```

**Supported Platforms:** `other`, `github`, `twitter`, `website`, `linkedin`, `facebook`, `instagram`, `portfolio`

#### Response:
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "token": "NEW_JWT_TOKEN",
  "data": {
    "user": {
      "id": "6891c2853fecc41d98dfe6a3",
      "email": "shoagasraful4231@gmail.com",
      "roles": ["scholar"],
      "isVerified": false,
      "companyName": "My Company",
      "interests": ["blockchain", "web3"],
      "newsletter": true,
      // ... other fields
    }
  }
}
```

## 🔧 Fixing Wallet Email Issue

### Step 1: Check Current User
```bash
GET /api/auth/me
```

### Step 2: Update Email Address
```bash
curl -X PATCH "http://localhost:8080/api/auth/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-real-email@gmail.com"
  }'
```

### Step 3: Verify Update
```bash
GET /api/auth/me
```

### Step 4: Try RSVP Again
After updating to a real email, RSVPs will work and you'll receive confirmation emails.

## ⚠️ Important Notes

### Email Update Rules:
- ✅ **Valid email format required**
- ✅ **Real email addresses only** (no `@wallet.temp`)
- ✅ **Must be unique** (not used by another account)
- ✅ **Verification reset** (isVerified becomes false when email changes)
- ✅ **New JWT token** issued with updated user data

### RSVP Validation:
- ❌ **Wallet emails blocked** - RSVPs will fail with clear error message
- ✅ **Real emails allowed** - RSVPs work normally with email confirmations

## 🧪 Testing the Fix

### Test Case 1: Update Wallet Email
```bash
# Current user has wallet email
GET /api/auth/me
# Response: "email": "0xa635b319a6bec867167331ef3b8578887a8d4397@wallet.temp"

# Update to real email
PATCH /api/auth/profile
{
  "email": "shoagasraful4231@gmail.com"
}

# Verify update
GET /api/auth/me  
# Response: "email": "shoagasraful4231@gmail.com", "isVerified": false
```

### Test Case 2: Try RSVP After Update
```bash
# This should now work
POST /api/rsvp
{
  "eventId": "63c64bb1-4479-4c84-8845-d182616a9d9c",
  "status": "attending",
  "guestCount": 1
}

# Should receive confirmation email at shoagasraful4231@gmail.com
```

## 🚨 Error Handling

### Invalid Email Format:
```json
{
  "status": "error",
  "message": "Please provide a valid email address"
}
```

### Wallet Email Attempt:
```json
{
  "status": "error", 
  "message": "Wallet temporary emails are not allowed. Please use a real email address."
}
```

### Email Already Taken:
```json
{
  "status": "error",
  "message": "This email address is already in use by another account"
}
```

### RSVP with Wallet Email:
```json
{
  "status": "error",
  "message": "No valid email found for this user. Please update your email address to receive RSVP confirmations and event notifications."
}
```

## 🎯 Complete Solution

1. **Check current user**: `GET /api/auth/me`
2. **Update email**: `PATCH /api/auth/profile` with real email
3. **Verify update**: `GET /api/auth/me` 
4. **Test RSVP**: `POST /api/rsvp` should now work
5. **Receive emails**: Confirmation emails will be delivered to real email address

This solves the wallet email issue completely by providing a clear path for users to update their email addresses and receive proper notifications.
