# Unified Wallet Authentication Flow

## ✅ **Single Flow for Everything**

Now you have **one simple flow** that handles both login and registration automatically:

### **Step 1: Request Signature**
```bash
POST /api/auth/wallet/request-signature
{
  "wallet_address": "0xa635b319a6bec867167331ef3b8578887a8d4397"
}
```

### **Step 2: Verify Signature (Login OR Register)**
```bash
POST /api/auth/wallet/verify-signature
{
  "wallet_address": "0xa635b319a6bec867167331ef3b8578887a8d4397",
  "signature": "0x..."
}
```

## 🎯 **How It Works**

The `/api/auth/wallet/verify-signature` endpoint now intelligently:

### **Case 1: Existing User**
- ✅ **Finds existing account** by wallet address or temp email
- ✅ **Logs you in** to existing account
- ✅ **Updates last login** timestamp
- ✅ **Returns JWT token** for existing account

### **Case 2: New User**
- ✅ **Creates new account** with temp email
- ✅ **Sets up wallet authentication**
- ✅ **Returns JWT token** for new account
- ✅ **Marks as verified** automatically

### **Case 3: Duplicate Handling**
- ✅ **Handles race conditions** gracefully
- ✅ **Resolves conflicts** automatically
- ✅ **Falls back to login** if creation fails

## 🔧 **Enhanced Logic**

### **Smart User Lookup**
```typescript
// Checks both wallet address AND temp email
let user = await UserModel.findOne({
  $or: [
    { wallet_address: wallet_address.toLowerCase() },
    { email: `${wallet_address.toLowerCase()}@wallet.temp` }
  ]
});
```

### **Robust Error Handling**
```typescript
// If duplicate key error occurs, find existing user
if (error.code === 11000) {
  user = await UserModel.findOne({ /* same query */ });
  // Login to existing account
}
```

## 📋 **Response Format**

### **Successful Login/Registration**
```json
{
  "status": "success",
  "message": "Authentication successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "email": "0xa635b319a6bec867167331ef3b8578887a8d4397@wallet.temp",
      "wallet_address": "0xa635b319a6bec867167331ef3b8578887a8d4397",
      "isVerified": true,
      "roles": ["scholar"],
      "lastLogin": "2025-08-15T12:00:00.000Z"
    }
  }
}
```

## 🎉 **Benefits**

- ✅ **Single flow** for both login and registration
- ✅ **No more confusion** about which endpoint to use
- ✅ **Automatic conflict resolution**
- ✅ **Robust error handling**
- ✅ **Debug logging** for troubleshooting
- ✅ **Consistent user experience**

## 🚨 **Error Handling**

### **Invalid Signature**
```json
{
  "status": "fail",
  "message": "Signature verification failed",
  "statusCode": 401
}
```

### **Expired Nonce**
```json
{
  "status": "fail",
  "message": "Nonce has expired or is invalid",
  "statusCode": 400
}
```

### **Account Conflict (Rare)**
```json
{
  "status": "fail",
  "message": "Unable to create or find user account",
  "statusCode": 409
}
```

## 🔍 **Debug Information**

The endpoint now includes comprehensive debug logging:

```
[WALLET AUTH DEBUG] Wallet: 0xa635b319a6bec867167331ef3b8578887a8d4397
[WALLET AUTH DEBUG] Temp email: 0xa635b319a6bec867167331ef3b8578887a8d4397@wallet.temp
[WALLET AUTH DEBUG] Found existing user: { id: '...', email: '...', wallet: '...', isVerified: true }
[WALLET AUTH DEBUG] Logging into existing user
```

## 🎯 **Your Use Case**

For your wallet `0xa635b319a6bec867167331ef3b8578887a8d4397`:

1. **First time**: Creates new account with temp email
2. **Subsequent times**: Logs into existing account
3. **No more errors**: Handles duplicates gracefully
4. **Single flow**: Same endpoints every time

**Now you have the simple, unified wallet authentication flow you wanted!** 🚀
